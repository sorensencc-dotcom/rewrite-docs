# TheFoundry — deterministic docs + roadmap compiler (PHASE-0.9)
#
# Multi-stage build:
#   node-build   — full toolchain (git/jq/yq/curl), installs deps, warm-runs the pipeline
#   node-runtime — sealed runtime: node + bash only, no build tools
#
# Build (from c:\dev):
#   docker build --build-context phases=roadmap-runner/phases -t cic/thefoundry:latest TheFoundry

FROM node:20-alpine AS node-build

RUN apk add --no-cache \
    bash \
    git \
    jq \
    yq \
    curl

WORKDIR /foundry

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Windows checkouts arrive with CRLF; bash requires LF
RUN sed -i 's/\r$//' *.sh roadmap-harness/*.sh && chmod +x *.sh roadmap-harness/*.sh

# Phase configs + roadmap dir at the ../ paths the validators expect
COPY --from=phases / /roadmap-runner/phases/
RUN mkdir -p /docs/roadmap

# Warm run: prove the pipeline works while build tools are still present
RUN SOURCE_DATE_EPOCH=0 bash build.sh

FROM node:20-alpine AS node-runtime

# Sealed runtime: bash for the pipeline scripts, nothing else added
RUN apk add --no-cache bash

WORKDIR /foundry

COPY --from=node-build /foundry /foundry
COPY --from=node-build /roadmap-runner /roadmap-runner
RUN mkdir -p /docs/roadmap

CMD ["npm", "run", "test:thefoundry"]
