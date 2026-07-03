FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY tsconfig.json .
COPY src ./src

# Build
RUN npm run build

# Expose port
EXPOSE 8000

# Start
CMD ["node", "dist/server.js"]
