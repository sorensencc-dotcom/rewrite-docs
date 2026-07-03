FROM node:20-alpine AS builder
WORKDIR /app

# Install build tools for better-sqlite3 native module
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY src ./src
COPY tsconfig.json ./

RUN npm run build

FROM node:20-alpine
WORKDIR /app

# Install build tools for better-sqlite3 native module
RUN apk add --no-cache python3 make g++ curl

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY src/db ./dist/db

EXPOSE 3111

CMD ["node", "dist/server.js"]
