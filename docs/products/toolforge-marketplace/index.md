---
title: "Toolforge Marketplace"
summary: "Skill marketplace for Toolforge: an Express and PostgreSQL API, a React browsing UI, and a `toolforge` CLI for search, install, and local plugins."
tags:
  - products
  - toolforge-marketplace
---

# Toolforge Marketplace

Toolforge Marketplace is where Toolforge skills get listed, found, rated, and installed. The repository README is only a title, so this page is drawn from the code on `main`. There are three pieces: an HTTP API, a browsing UI, and a command-line client called `toolforge`.

The API is an Express app in `src/api/server.js` backed by PostgreSQL. It reads `DATABASE_URL` and listens on `PORT`, defaulting to 3000. The two migrations create `skills`, `versions`, `ratings`, `trending_metrics`, `installation_log`, and `categories`. Under `/api/v1/skills` you can list, search, and get trending skills, fetch one skill and its versions, read and write ratings, get related skills, and resolve a version constraint to a concrete version. `/api/v1/categories` lists categories, and `/health` checks the database. The user always comes from the request's auth context, never from the body. The code says no session store exists yet, so it reads a session user ID if one is present and otherwise falls back to an `x-user-id` header as a development stand-in. Rating writes require a user and are rate-limited.

The same server has an Ollama-backed provider surface under `/api/v1/providers`, with short aliases at `/api/generate`, `/api/audit`, and `/api/models`. It generates text, runs an adversarial cross-audit over a submitted packet (spec goal, scope, test output, diff, and history), and lists the installed models. Those calls need a user, allow 30 requests a minute and at most five at once, and cap prompts at 32,000 characters. The Ollama base URL comes from `OLLAMA_BASE_URL`.

Trending is a nightly batch. `npm run trending:refresh` recomputes `trending_metrics` for every skill in one SQL statement, scoring recent installs against the 30-day baseline. `src/services/trending-scheduler.ps1` can register a Windows scheduled task, `ToolforgeTrendingRefresh`, for 00:00 UTC. Its runbook says the repo never installs that task on its own. The React UI under `src/ui/`, built with Vite, has a skill list, skill detail, trending, a category nav, ratings and reviews, related skills, and a version-pin selector. A skill manifest has to name its name, version, category, description, owner, entrypoint, and runtime, and the validators check that along with semver pins.

The `toolforge` CLI (`src/cli/index.js`) talks to the API at `--api-url`, which defaults to `http://localhost:3000`. It can `list`, `search`, and `install` skills. In the current code, `install` looks the skill up, picks a version, and writes `.toolforge-install.json` into the destination folder. It doesn't download skill files, and its install-logging call is a placeholder. The CLI also manages local plugins. `toolforge plugins add <path>` records a plugin in `~/.toolforge/plugins.json`. `toolforge exec <plugin-id> <command>`, or just the plugin's namespace, checks the arguments against the plugin manifest and imports the plugin's entry point, refusing one that escapes the plugin folder. The repo ships one plugin, `toolforge-pdf/`. Its `ingest` command extracts a PDF's text layer and flags pages with no text as `needs_ocr`, because OCR isn't implemented.

The same marketplace code also sits under `src/` in the Toolforge repository. That repo's root `package.json` is named `toolforge-marketplace` too, and its `npm run dev` starts the same Marketplace API. The two copies match except for small differences in the provider routes, and this repo also carries a built UI under `src/ui/dist`. The marketplace repo's `wiki/` folder is a copy of the Toolforge Platform wiki, not marketplace documentation, so this page doesn't use it.

## Where the writeups live

The full tree stays in the marketplace repository. This page is only the index.

- GitHub: [sorensencc-dotcom/toolforge-marketplace](https://github.com/sorensencc-dotcom/toolforge-marketplace)
- API: [src/api/server.js](https://github.com/sorensencc-dotcom/toolforge-marketplace/blob/main/src/api/server.js) and [src/api/README.md](https://github.com/sorensencc-dotcom/toolforge-marketplace/blob/main/src/api/README.md)
- Database schema: [src/db/migrations/](https://github.com/sorensencc-dotcom/toolforge-marketplace/tree/main/src/db/migrations)
- CLI: [src/cli/](https://github.com/sorensencc-dotcom/toolforge-marketplace/tree/main/src/cli)
- Services and trending batch: [src/services/README.md](https://github.com/sorensencc-dotcom/toolforge-marketplace/blob/main/src/services/README.md)
- Browsing UI: [src/ui/](https://github.com/sorensencc-dotcom/toolforge-marketplace/tree/main/src/ui)
- Manifest and semver validators: [src/validators/](https://github.com/sorensencc-dotcom/toolforge-marketplace/tree/main/src/validators)
- PDF plugin: [toolforge-pdf/](https://github.com/sorensencc-dotcom/toolforge-marketplace/tree/main/toolforge-pdf)
- Load test runbook: [docs/wave-d/LOAD-TEST.md](https://github.com/sorensencc-dotcom/toolforge-marketplace/blob/main/docs/wave-d/LOAD-TEST.md)
- Trending scheduler runbook: [docs/wave-d/TRENDING-SCHEDULER.md](https://github.com/sorensencc-dotcom/toolforge-marketplace/blob/main/docs/wave-d/TRENDING-SCHEDULER.md)
- Local checkout on this machine: `C:\dev\toolforge-marketplace`
