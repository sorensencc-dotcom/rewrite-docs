# CIC Development Environment
# Single-stage: use pre-built dist/ from host
# Version: 2.2.0 | Purpose: Skip Docker TS build (ultra-fast)
# Node 22 LTS: Active until 2027-04-30
# NOTE: Run `npm run build` on host before docker build

FROM node:22-alpine

WORKDIR /workspace

RUN apk add --no-cache curl git python3 jq ca-certificates bash openssh-client

COPY package*.json ./

RUN npm ci --omit=dev --prefer-offline --no-fund

# Copy pre-built dist/ from host
COPY dist/ ./dist/

# Setup Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code && claude --version

# Create app user (non-root)
RUN adduser -D -s /bin/bash chris && \
    mkdir -p /home/chris/.config/cic && \
    mkdir -p /home/chris/.ssh && \
    chmod 700 /home/chris/.ssh

# Copy operational scripts
COPY --chown=chris:chris scripts/ ./scripts/

# Create log directory + SSH
RUN mkdir -p logs && chown chris:chris logs && mkdir -p /run/sshd

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
