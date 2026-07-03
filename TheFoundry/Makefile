.PHONY: help build docs validate manifest clean

help:
	@echo "TheFoundry v3.0 — Docs + Roadmap Compiler"
	@echo ""
	@echo "Commands:"
	@echo "  make build      - Full pipeline (build + validate + manifest)"
	@echo "  make docs       - Build docs only"
	@echo "  make validate   - Validate docs only"
	@echo "  make manifest   - Generate manifest only"
	@echo "  make clean      - Clean output directory"

build:
	docker build -t foundry:latest .
	docker run --rm -v $(CURDIR)/..:/workspace --workdir /workspace/TheFoundry foundry

docs:
	docker build -t foundry:latest .
	docker run --rm -v $(CURDIR)/..:/workspace --workdir /workspace/TheFoundry foundry bash build-docs.sh

validate:
	docker build -t foundry:latest .
	docker run --rm -v $(CURDIR)/..:/workspace --workdir /workspace/TheFoundry foundry bash validate-docs.sh

manifest:
	docker build -t foundry:latest .
	docker run --rm -v $(CURDIR)/..:/workspace --workdir /workspace/TheFoundry foundry node generate-manifest.js

clean:
	rm -rf out/
	mkdir -p out/{docs/roadmap,roadmap}
