# CIC Development Environment
# Multi-stage build: deps → builder → runtime (optimized for speed)
# Version: 2.1.0 | Purpose: Reduce Docker context deadline timeouts
# Node 22 LTS: Active until 2027-04-30

# Stage 1: Dependencies (separate cacheable layer)
FROM node:22-alpine AS deps

WORKDIR /workspace

RUN apk add --no-cache curl git python3 make g++

COPY package*.json ./

RUN npm ci --omit=dev --prefer-offline --no-fund 2>&1 | tail -20

# Stage 2: Builder
FROM node:22-alpine AS builder

WORKDIR /workspace

RUN apk add --no-cache curl git python3 make g++

COPY package*.json tsconfig.json ./
COPY --from=deps /workspace/node_modules ./node_modules

COPY . .

RUN npm run build 2>&1 || true

# Stage 2: Runtime base
FROM node:22-alpine AS runtime

ENV NODE_ENV=production \
    CIC_ENV=production

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    git \
    jq \
    openssh-client \
    python3 \
    ca-certificates \
    bash

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code && \
    claude --version

# Create app user (non-root)
RUN adduser -D -s /bin/bash chris && \
    mkdir -p /home/chris/.config/cic && \
    mkdir -p /home/chris/.ssh && \
    chmod 700 /home/chris/.ssh

WORKDIR /workspace

# Copy compiled code from builder
COPY --from=builder --chown=chris:chris /workspace/dist ./dist
COPY --from=builder --chown=chris:chris /workspace/node_modules ./node_modules
COPY --from=builder --chown=chris:chris /workspace/package*.json ./

# Copy operational scripts
COPY --chown=chris:chris scripts/ ./scripts/

# Create log directory
RUN mkdir -p logs && chown chris:chris logs && \
    mkdir -p /run/sshd

# Setup SSH configuration
RUN echo "PasswordAuthentication no" >> /etc/ssh/sshd_config && \
    echo "PubkeyAuthentication yes" >> /etc/ssh/sshd_config && \
    echo "PermitRootLogin no" >> /etc/ssh/sshd_config && \
    echo "StrictModes yes" >> /etc/ssh/sshd_config

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3100/health || exit 1

# Switch to non-root user
USER chris

# Expose ports: MCP (3100), SSH (22), optional secondary MCP servers (3101-3110)
EXPOSE 22 3100 3101 3102 3103 3104 3105 3106 3107 3108 3109 3110

# Default entrypoint: startup script with validation
ENTRYPOINT ["/bin/bash", "./scripts/cic-docker-entrypoint.sh"]
CMD ["start"]
