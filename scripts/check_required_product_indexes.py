"""Fail the docs build when a known product has no index page,
or when that product repo has moved past last_reviewed.

List: docs/meta/required-product-indexes.yml
Each entry must exist under the MkDocs docs directory and be linked from
mkdocs.yml nav. Each entry also names a public GitHub repo and a
last_reviewed date (YYYY-MM-DD).

Freshness uses the later of the author and committer timestamps on the
tip commit of that repo's default branch. The deadline is the end of the
last_reviewed calendar day in America/New_York: a commit during that day,
including late evening Eastern, still passes. A commit at or after the
next midnight Eastern fails. Bumping last_reviewed is the attestation
that someone looked again. This script does not read the page prose and
does not decide whether the writeup actually changed.

The product repos are public. Requests go to the GitHub REST API with no
Authorization header, even if GITHUB_TOKEN or GH_TOKEN is set. A token
minted for the rewrite-docs workflow is scoped to that repository.
contents: read on this repo is not permission to read the others, and
sending that token makes GitHub answer 404 for a repo the token cannot
see. No extra secret is required while these repos stay public.

MkDocs loads this file as a hook (on_config), so `mkdocs build --strict`
fails closed. The docs workflow runs the same check.

Scoping for pull requests: --only <id,...> (or the PRODUCT_INDEX_CHECK_ONLY
env var) limits the *freshness* check to the named products. The structural
checks (page exists on disk, page in nav, valid dates and repo names) always
run for every product. --touched-since <git-ref> freshness-checks only the
products whose index page or list entry changed since <git-ref>; it exists
for PR builds (e.g. --touched-since origin/main) so a PR that re-reviews one
product is not failed by other products' staleness. Push builds check
everything.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import date, datetime, time as dt_time, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import yaml

LIST_REL = Path("docs/meta/required-product-indexes.yml")
MKDOCS_REL = Path("mkdocs.yml")
REVIEW_TZ_NAME = "America/New_York"
REPO_RE = re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")
API = "https://api.github.com"
USER_AGENT = "rewrite-docs-product-index-check"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def review_tz() -> ZoneInfo:
    try:
        return ZoneInfo(REVIEW_TZ_NAME)
    except Exception as exc:  # ZoneInfoNotFoundError, and tzdata missing on Windows
        raise RuntimeError(
            f"cannot load timezone {REVIEW_TZ_NAME} ({exc}). "
            "Install tzdata on platforms without a system zone database."
        ) from exc


def end_of_reviewed_day(reviewed: date, tz: ZoneInfo) -> datetime:
    """First instant of the next calendar day in America/New_York.

    Commits timestamped during last_reviewed still pass. Commits at or
    after this instant are past the reviewed day.
    """
    start = datetime.combine(reviewed, dt_time.min, tzinfo=tz)
    return start + timedelta(days=1)


def iter_nav_paths(node):
    if isinstance(node, list):
        for item in node:
            yield from iter_nav_paths(item)
    elif isinstance(node, dict):
        for value in node.values():
            if isinstance(value, str):
                yield value.replace("\\", "/")
            else:
                yield from iter_nav_paths(value)
    elif isinstance(node, str):
        yield node.replace("\\", "/")


@dataclass
class Freshness:
    product_id: str
    title: str
    repo: str
    branch: str
    sha: str
    stamp: datetime
    stamp_field: str
    last_reviewed: date


def _parse_github_time(value: str) -> datetime:
    text = value.strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    parsed = datetime.fromisoformat(text)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _parse_reviewed(value) -> date | None:
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        try:
            return date.fromisoformat(value)
        except ValueError:
            return None
    return None


def github_json(url: str) -> dict:
    """GET a public GitHub URL. Never sends an Authorization header."""
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    request = urllib.request.Request(url, headers=headers)
    delay = 2.0
    last_error = f"no response from {url}"
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                payload = json.load(response)
            if not isinstance(payload, dict):
                raise RuntimeError(f"unexpected GitHub payload from {url}")
            return payload
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")[:300]
            last_error = f"HTTP {exc.code} from {url}: {body}"
            if exc.code in (403, 429, 502, 503) and attempt < 3:
                retry_after = exc.headers.get("Retry-After") if exc.headers else None
                wait = float(retry_after) if retry_after and str(retry_after).isdigit() else delay
                time.sleep(min(wait, 30.0))
                delay *= 2
                continue
            raise RuntimeError(last_error) from exc
        except urllib.error.URLError as exc:
            last_error = f"network error from {url}: {exc.reason}"
            if attempt < 3:
                time.sleep(delay)
                delay *= 2
                continue
            raise RuntimeError(last_error) from exc
    raise RuntimeError(last_error)


def tip_commit(repo: str) -> tuple[str, str, datetime, str]:
    meta = github_json(f"{API}/repos/{repo}")
    if meta.get("private") is True:
        raise RuntimeError(
            f"{repo} is private; this check only reads public repos and does not use a token"
        )
    branch = str(meta.get("default_branch") or "")
    if not branch:
        raise RuntimeError(f"{repo}: GitHub did not return default_branch")
    # Keep slashes so a default branch like "codex/weekly-retro-reporting" stays a path.
    ref = urllib.parse.quote(branch, safe="/")
    commit = github_json(f"{API}/repos/{repo}/commits/{ref}")
    sha = str(commit.get("sha") or "")
    commit_obj = commit.get("commit") or {}
    author_raw = (commit_obj.get("author") or {}).get("date")
    committer_raw = (commit_obj.get("committer") or {}).get("date")
    if not sha or not author_raw or not committer_raw:
        raise RuntimeError(f"{repo}: tip commit on {branch} has no sha or timestamps")
    author_dt = _parse_github_time(str(author_raw))
    committer_dt = _parse_github_time(str(committer_raw))
    if author_dt > committer_dt:
        return branch, sha, author_dt, "author"
    return branch, sha, committer_dt, "committer"


def _fmt_utc(moment: datetime) -> str:
    return moment.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _fmt_local(moment: datetime, tz: ZoneInfo) -> str:
    return moment.astimezone(tz).strftime("%Y-%m-%d %H:%M:%S")


def _parse_only(value: str | None) -> set[str] | None:
    """Parse a comma-separated product-id list.

    None means check everything. Any other value (even blank) yields a set;
    an empty set freshness-checks nothing.
    """
    if value is None:
        return None
    return {part.strip() for part in value.split(",") if part.strip()}


def _blob_at(root: Path, ref: str, rel: str) -> bytes | None:
    """Raw bytes of a file at <ref>, or None when unreadable.

    Uses `git show`, so only the ref's tip commit must be present locally;
    no merge-base computation is needed.
    """
    try:
        proc = subprocess.run(
            ["git", "show", f"{ref}:{rel}"],
            cwd=root,
            capture_output=True,
            timeout=60,
        )
    except Exception:
        return None
    return proc.stdout if proc.returncode == 0 else None


def _read_products(root: Path) -> list:
    try:
        listed = yaml.safe_load((root / LIST_REL).read_text(encoding="utf-8")) or {}
    except Exception:
        return []
    products = listed.get("products")
    return products if isinstance(products, list) else []


def _docs_dir_name(root: Path) -> str:
    try:
        mkdocs = yaml.safe_load((root / MKDOCS_REL).read_text(encoding="utf-8")) or {}
    except Exception:
        return "docs"
    name = str(mkdocs.get("docs_dir") or "docs").replace("\\", "/").strip("/")
    return name or "docs"


def _touched_products(
    root: Path, ref: str, products: list, docs_dir: str = "docs"
) -> set[str] | None:
    """Ids of products whose index page or list entry changed since <ref>.

    Compares each product's list entry and index-page bytes between <ref>
    and the working tree. Returns None when <ref> cannot be read, in which
    case callers should check everything.
    """
    raw = _blob_at(root, ref, LIST_REL.as_posix())
    if raw is None:
        return None
    try:
        old = yaml.safe_load(raw.decode("utf-8")) or {}
    except Exception:
        return None
    old_entries: dict[str, object] = {}
    for entry in old.get("products") or []:
        if isinstance(entry, dict) and entry.get("id"):
            old_entries[str(entry["id"])] = entry
    touched: set[str] = set()
    for entry in products:
        if not isinstance(entry, dict) or not entry.get("id"):
            continue
        product_id = str(entry["id"])
        if old_entries.get(product_id) != entry:
            # New product, or any entry change (last_reviewed bump,
            # repo move, title change, ...).
            touched.add(product_id)
            continue
        index = str(entry.get("index") or "").replace("\\", "/").lstrip("/")
        if not index:
            continue
        # index paths in the list are relative to the MkDocs docs_dir.
        rel = (Path(docs_dir) / Path(index)).as_posix()
        old_blob = _blob_at(root, ref, rel)
        try:
            new_path = root / Path(rel)
            new_blob = new_path.read_bytes() if new_path.is_file() else None
        except OSError:
            new_blob = None
        if old_blob != new_blob:
            touched.add(product_id)
    return touched


def check(
    root: Path, only: set[str] | None = None
) -> tuple[list[str], list[Freshness]]:
    """Run the checks.

    only: when not None, the freshness check (tip commit vs last_reviewed)
    runs solely for these product ids. Structural checks always run for
    every product.
    """
    errors: list[str] = []
    fresh: list[Freshness] = []
    list_path = root / LIST_REL
    mkdocs_path = root / MKDOCS_REL
    if not list_path.is_file():
        return [f"missing product index list: {LIST_REL.as_posix()}"], fresh
    if not mkdocs_path.is_file():
        return [f"missing {MKDOCS_REL.as_posix()}"], fresh

    listed = yaml.safe_load(list_path.read_text(encoding="utf-8")) or {}
    products = listed.get("products")
    if not isinstance(products, list) or not products:
        return [f"{LIST_REL.as_posix()} has no products"], fresh

    mkdocs = yaml.safe_load(mkdocs_path.read_text(encoding="utf-8")) or {}
    nav_paths = set(iter_nav_paths(mkdocs.get("nav")))
    docs_dir = root / (mkdocs.get("docs_dir") or "docs")
    seen: set[str] = set()

    try:
        tz = review_tz()
    except RuntimeError as exc:
        return [str(exc)], fresh

    for entry in products:
        if not isinstance(entry, dict):
            errors.append(f"product entry is not a mapping: {entry!r}")
            continue
        product_id = str(entry.get("id") or "<missing id>")
        title = str(entry.get("title") or product_id)
        index = str(entry.get("index") or "").replace("\\", "/").lstrip("/")
        if not index:
            errors.append(f"{product_id}: missing index path")
            continue
        if index in seen:
            errors.append(f"{product_id}: duplicate index path {index}")
        seen.add(index)
        if not (docs_dir / Path(index)).is_file():
            errors.append(
                f"{title} ({product_id}): index page missing on disk: {index}"
            )
        if index not in nav_paths:
            errors.append(
                f"{title} ({product_id}): index page missing from mkdocs.yml nav: {index}"
            )

        reviewed = _parse_reviewed(entry.get("last_reviewed"))
        if reviewed is None:
            errors.append(
                f"{title} ({product_id}): last_reviewed must be YYYY-MM-DD"
            )
        repo = str(entry.get("repo") or "")
        if not REPO_RE.fullmatch(repo):
            errors.append(
                f"{title} ({product_id}): repo must be owner/name, got {repo!r}"
            )
            continue
        if reviewed is None:
            continue
        if only is not None and product_id not in only:
            continue
        try:
            branch, sha, stamp, stamp_field = tip_commit(repo)
        except RuntimeError as exc:
            errors.append(f"{title} ({product_id}): {exc}")
            continue
        deadline = end_of_reviewed_day(reviewed, tz)
        if stamp >= deadline:
            errors.append(
                f"{title} ({product_id}): default branch {branch} of {repo} "
                f"has commit {sha} at {_fmt_utc(stamp)} "
                f"({_fmt_local(stamp, tz)} {REVIEW_TZ_NAME}, {stamp_field} date), "
                f"after last_reviewed {reviewed.isoformat()} "
                f"(that {REVIEW_TZ_NAME} day ends at {_fmt_utc(deadline)})"
            )
        else:
            fresh.append(
                Freshness(
                    product_id=product_id,
                    title=title,
                    repo=repo,
                    branch=branch,
                    sha=sha,
                    stamp=stamp,
                    stamp_field=stamp_field,
                    last_reviewed=reviewed,
                )
            )
    return errors, fresh


def on_config(config):
    root = Path(config["config_file_path"]).resolve().parent
    only = _parse_only(os.environ.get("PRODUCT_INDEX_CHECK_ONLY"))
    errors, _fresh = check(root, only=only)
    if errors:
        from mkdocs.exceptions import ConfigurationError

        message = "required product index check failed:\n" + "\n".join(
            f"- {item}" for item in errors
        )
        raise ConfigurationError(message)
    return config


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Fail when a required product index page is missing or stale."
    )
    parser.add_argument(
        "--only",
        default=None,
        metavar="IDS",
        help="Comma-separated product ids: freshness-check only these. "
        "Structural checks still run for every product. Overrides "
        "PRODUCT_INDEX_CHECK_ONLY.",
    )
    parser.add_argument(
        "--touched-since",
        default=None,
        metavar="GIT_REF",
        help="Freshness-check only products whose index page or list entry "
        "changed since GIT_REF (e.g. origin/main). Falls back to checking "
        "everything when the ref cannot be read.",
    )
    args = parser.parse_args(argv)

    root = repo_root()
    only = _parse_only(
        args.only if args.only is not None else os.environ.get("PRODUCT_INDEX_CHECK_ONLY")
    )
    if only is None and args.touched_since:
        only = _touched_products(
            root, args.touched_since, _read_products(root), _docs_dir_name(root)
        )
    errors, fresh = check(root, only=only)
    if errors:
        print("required product index check failed:", file=sys.stderr)
        for item in errors:
            print(f"- {item}", file=sys.stderr)
        return 1
    scope_note = (
        "" if only is None else f" (freshness scoped to: {', '.join(sorted(only)) or 'none'})"
    )
    print(f"required product index check passed ({len(fresh)} products fresh{scope_note})")
    for item in fresh:
        try:
            tz = review_tz()
        except RuntimeError:
            local = ""
        else:
            local = f" ({_fmt_local(item.stamp, tz)} {REVIEW_TZ_NAME})"
        print(
            f"freshness ok: {item.product_id} last_reviewed={item.last_reviewed.isoformat()} "
            f"repo={item.repo} branch={item.branch} sha={item.sha} "
            f"{item.stamp_field}={_fmt_utc(item.stamp)}{local}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
