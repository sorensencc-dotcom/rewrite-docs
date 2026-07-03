FROM node:20-alpine

WORKDIR /app

# Install docker CLI (for docker-in-docker)
RUN apk add --no-cache docker-cli

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY scheduler.js docker-runner.js success-gate-validator.js ./

# Create state and logs directories
RUN mkdir -p logs

# Make scheduler executable
RUN chmod +x scheduler.js

# Default command: run once
CMD ["npm", "start"]
