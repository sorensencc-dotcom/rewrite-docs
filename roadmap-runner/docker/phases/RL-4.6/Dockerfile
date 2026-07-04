# RL-4.6 — CrawlerEngine v1
# Build (context = rewrite-mcp monorepo root):
#   docker build -f roadmap-runner/docker/phases/RL-4.6/Dockerfile \
#     --build-context harness=roadmap-runner/docker/phases/RL-4.6 \
#     -t rewrite-labs/rl-4.6:latest .

FROM node:20-alpine AS builder

WORKDIR /build

# Copy monorepo manifests
COPY package.json package-lock.json pnpm-workspace.yaml ./
COPY packages/agents/package.json ./packages/agents/

# Install workspace deps + @types/node
RUN npm ci --frozen-lockfile && npm install --no-save @types/node

# Copy agents source and compile
COPY packages/agents ./packages/agents
WORKDIR /build/packages/agents
RUN npm run build

FROM node:20-alpine

WORKDIR /app

# Copy compiled agents
COPY --from=builder /build/packages/agents/dist ./dist
COPY --from=builder /build/packages/agents/package.json ./package.json

# Install production deps (node-html-parser required by crawler)
RUN npm install --omit=dev

# Harness
COPY --from=harness harness.mjs ./harness.mjs
RUN npm pkg set scripts.test:crawler="node harness.mjs"

CMD ["npm", "run", "test:crawler"]
