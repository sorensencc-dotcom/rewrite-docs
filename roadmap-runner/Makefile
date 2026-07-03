.PHONY: help setup build up down logs status phase-% clean test

help:
	@echo "Roadmap Runner - CIC + Rewrite Labs Phase Orchestration"
	@echo ""
	@echo "Setup:"
	@echo "  make setup          - Copy .env.local.example to .env.local"
	@echo "  make build          - Build Docker image"
	@echo ""
	@echo "Run:"
	@echo "  make up             - Start roadmap-runner + services (detached)"
	@echo "  make down           - Stop all services"
	@echo "  make loop           - Run scheduler in loop mode (attached)"
	@echo "  make once           - Run scheduler once (attached)"
	@echo "  make phase-RL-4.0   - Run single phase"
	@echo ""
	@echo "Monitor:"
	@echo "  make logs           - Follow roadmap-runner logs"
	@echo "  make status         - Show state-store.json"
	@echo "  make clean          - Reset state-store.json"
	@echo ""
	@echo "Test:"
	@echo "  make test           - Run tests"
	@echo "  make lint           - Lint YAML phase configs"

setup:
	@if [ ! -f .env.local ]; then \
		cp .env.local.example .env.local; \
		echo "✓ Created .env.local — edit with your credentials"; \
	else \
		echo ".env.local already exists"; \
	fi

build:
	docker build -t roadmap-runner:latest .

up: build
	docker-compose up -d
	@echo "✓ Services started (detached)"
	@echo "  Roadmap Runner: docker-compose logs -f roadmap-runner"
	@echo "  Qdrant API: http://localhost:6333"
	@echo "  Prometheus: http://localhost:9090"

down:
	docker-compose down

loop: build
	docker-compose run --rm roadmap-runner node scheduler.js --loop --interval 60

once: build
	docker-compose run --rm roadmap-runner node scheduler.js --once

phase-%: build
	docker-compose run --rm roadmap-runner node scheduler.js --phase $*

logs:
	docker-compose logs -f roadmap-runner

status:
	@cat state-store.json | jq '.phases | to_entries | map({phase:.key, status:.value.status}) | sort_by(.phase)'

clean:
	@echo "Resetting state-store.json..."
	@cp state-store.json state-store.json.backup
	@node -e "const state = {version:'v3.0',phases:{}}; const fs=require('fs'); Object.keys(JSON.parse(fs.readFileSync('state-store.json','utf8')).phases).forEach(p=>{state.phases[p]={status:'pending',lastRunAt:null,runs:[]}}); fs.writeFileSync('state-store.json',JSON.stringify(state,null,2))"
	@echo "✓ State reset (backup at state-store.json.backup)"

test:
	npm test

lint:
	@for f in phases/*.yaml; do \
		echo "Linting $$f..."; \
		docker run --rm -v $(PWD):/app -w /app siderite/yamllint -d relaxed $$f || exit 1; \
	done
	@echo "✓ All phase configs valid"

.PHONY: prometheus.yml
prometheus.yml:
	@echo "Generating prometheus.yml..."
	@cat > prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'qdrant'
    static_configs:
      - targets: ['qdrant:6333']

  - job_name: 'pushgateway'
    static_configs:
      - targets: ['prometheus-pushgateway:9091']
EOF
	@echo "✓ Created prometheus.yml"
