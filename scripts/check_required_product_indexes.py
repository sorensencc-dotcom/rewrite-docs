"""Fail the docs build when a known product has no index page.

List: docs/meta/required-product-indexes.yml
Each entry must exist under the MkDocs docs directory and be linked from
mkdocs.yml nav. MkDocs loads this file as a hook (on_config), so
`mkdocs build --strict` fails closed. The docs workflow runs the same check.
"""

from __future__ import annotations

import sys
from pathlib import Path

import yaml

LIST_REL = Path("docs/meta/required-product-indexes.yml")
MKDOCS_REL = Path("mkdocs.yml")


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


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


def check(root: Path) -> list[str]:
    errors: list[str] = []
    list_path = root / LIST_REL
    mkdocs_path = root / MKDOCS_REL
    if not list_path.is_file():
        return [f"missing product index list: {LIST_REL.as_posix()}"]
    if not mkdocs_path.is_file():
        return [f"missing {MKDOCS_REL.as_posix()}"]

    listed = yaml.safe_load(list_path.read_text(encoding="utf-8")) or {}
    products = listed.get("products")
    if not isinstance(products, list) or not products:
        return [f"{LIST_REL.as_posix()} has no products"]

    mkdocs = yaml.safe_load(mkdocs_path.read_text(encoding="utf-8")) or {}
    nav_paths = set(iter_nav_paths(mkdocs.get("nav")))
    docs_dir = root / (mkdocs.get("docs_dir") or "docs")
    seen: set[str] = set()

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
    return errors


def on_config(config):
    root = Path(config["config_file_path"]).resolve().parent
    errors = check(root)
    if errors:
        from mkdocs.exceptions import ConfigurationError

        message = "required product index check failed:\n" + "\n".join(
            f"- {item}" for item in errors
        )
        raise ConfigurationError(message)
    return config


def main() -> int:
    errors = check(repo_root())
    if errors:
        print("required product index check failed:", file=sys.stderr)
        for item in errors:
            print(f"- {item}", file=sys.stderr)
        return 1
    data = yaml.safe_load((repo_root() / LIST_REL).read_text(encoding="utf-8"))
    count = len(data.get("products") or [])
    print(f"required product index check passed ({count} products)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
