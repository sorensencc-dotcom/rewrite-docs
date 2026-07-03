FROM node:20-alpine AS base

# Install tools for docs processing
RUN apk add --no-cache \
    bash \
    git \
    jq \
    yq \
    curl

WORKDIR /foundry

# Copy package files
COPY package.json package-lock.json ./

# Install Node dependencies
RUN npm ci

# Copy scripts and schemas
COPY . .

# Ensure scripts are executable
RUN chmod +x *.sh

# Default entrypoint: run full build pipeline
ENTRYPOINT ["bash", "build.sh"]
