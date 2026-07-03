# CIC Development Environment
# Multi-stage build: compile → runtime
# Version: 1.0.0 | Purpose: Deterministic CIC startup with MCP servers

FROM ubuntu:24.04 AS base

ENV DEBIAN_FRONTEND=noninteractive \
    NODE_ENV=development \
    CIC_ENV=development

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    jq \
    lsof \
    openssh-server \
    build-essential \
    python3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20+
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    node --version && npm --version

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code && \
    claude --version

# Create app user (non-root)
RUN useradd -m -s /bin/bash chris && \
    mkdir -p /home/chris/.config/cic && \
    mkdir -p /home/chris/.ssh && \
    chmod 700 /home/chris/.ssh

# Setup SSH for headless operation
RUN mkdir -p /run/sshd && \
    echo "PasswordAuthentication no" >> /etc/ssh/sshd_config && \
    echo "PubkeyAuthentication yes" >> /etc/ssh/sshd_config && \
    echo "PermitRootLogin no" >> /etc/ssh/sshd_config && \
    echo "StrictModes yes" >> /etc/ssh/sshd_config

WORKDIR /workspace
RUN chown -R chris:chris /workspace

# Copy project files
COPY --chown=chris:chris . .

# Build stage: compile TypeScript
FROM base AS builder

WORKDIR /workspace
RUN npm ci && \
    npm run build && \
    npm run test || true

# Runtime stage: minimal footprint
FROM base AS runtime

WORKDIR /workspace

# Copy compiled code from builder
COPY --from=builder --chown=chris:chris /workspace/dist ./dist
COPY --from=builder --chown=chris:chris /workspace/node_modules ./node_modules
COPY --from=builder --chown=chris:chris /workspace/package*.json ./

# Copy operational scripts
COPY --chown=chris:chris scripts/ ./scripts/

# Create log directory
RUN mkdir -p logs && chown chris:chris logs

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
