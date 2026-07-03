# Multi-stage Dockerfile for Mailbox Intake Daemon
# Stage 1: Build & Test
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy all source
COPY . .

# Build TypeScript
RUN npm run build

# Stage 2: Test (use built code)
FROM node:20-alpine AS test

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy built code from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/tests ./tests
COPY jest.config.js tsconfig.json ./

# Run tests with coverage
CMD ["npm", "test", "--", "--coverage", "--verbose", "--runInBand"]

# Stage 3: Runtime (minimal)
FROM node:20-alpine AS runtime

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm install --only=production

# Copy built app
COPY --from=builder /app/dist ./dist

# Create working directories
RUN mkdir -p logs pending archive rejected cold

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD test -f dist/index.js || exit 1

# Run daemon
CMD ["node", "dist/index.js"]
