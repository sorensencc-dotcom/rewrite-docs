# CIC Agent Runtime v0.2
# Multi-tenant agent execution platform with Postgres persistence
# Production-ready multi-stage Node.js build

FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools
RUN apk add --no-cache python3 make g++ gcc

# Copy root and runtime package files
COPY package*.json ./
COPY cic-runtime/package*.json ./cic-runtime/
COPY tsconfig.json ./

# Install all deps
RUN npm install

# Copy source
COPY cic-runtime/*.ts ./cic-runtime/
COPY cic-agent ./cic-agent

# Build TypeScript
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

LABEL phase="27.0"
LABEL component="cic-agent-runtime"

# Install runtime deps
RUN apk add --no-cache curl bash postgresql-client

# Copy package files and built node_modules from builder
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Copy agent definitions (runtime uses these)
COPY --from=builder /app/cic-agent ./cic-agent

# Expose runtime port
EXPOSE 3118

# Health check: Runtime readiness endpoint
HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=15s \
  CMD curl -f http://localhost:3118/health || exit 1

# Start runtime server
CMD ["node", "dist/cic-runtime/server.js"]
