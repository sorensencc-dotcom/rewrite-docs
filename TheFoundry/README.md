# TheFoundry v3.0

Deterministic docs + roadmap compiler for CIC.

Turns all roadmap markdown files into:
- Validated dependency graph
- Phase configuration schema validation
- Drift detection
- Manifest for scheduler enforcement

---

## Build

```bash
docker build -t foundry .
docker run --rm -v $(pwd)/..:/workspace --workdir /workspace/TheFoundry foundry
```

Or via Makefile:

```bash
make build
```

---

## Output

```
out/
├── docs/
│   └── roadmap/               # Copied + validated markdown
├── roadmap/
│   └── ROADMAP_DEPENDENCY_GRAPH.json
└── manifest.json              # Scheduler enforcement anchor
```

---

## Components

- **build.sh** — Master entrypoint
- **build-docs.sh** — Lint + compile roadmap
- **validate-docs.sh** — Schema + drift checks
- **compile.js** — Roadmap → graph
- **validate-schema.js** — Roadmap schema validation
- **validate-phases.js** — Phase YAML validation
- **drift-detector.js** — Consistency checks
- **generate-manifest.js** — Manifest for scheduler

---

## Scheduler Integration

Add to `scheduler.js`:

```js
const manifest = JSON.parse(fs.readFileSync('TheFoundry/out/manifest.json'));
if (!manifest) {
  console.error("Run TheFoundry first");
  process.exit(1);
}
```

This ensures scheduler refuses to run with stale docs.

---

## Next Steps

- [ ] Wire to CI (auto-build on roadmap changes)
- [ ] Add mdBook for static site
- [ ] Add docs preview server
