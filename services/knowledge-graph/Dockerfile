FROM node:20-alpine AS builder
WORKDIR /app

# Install Python and build tools for better-sqlite3 native module build
RUN apk add --no-cache python3 build-base

COPY package*.json ./
RUN npm install

COPY src ./src
COPY tsconfig.json ./

RUN npm run build

FROM node:20-alpine
WORKDIR /app

# Install Python and build tools for better-sqlite3 native module
RUN apk add --no-cache python3 build-base curl

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/build ./build

EXPOSE 3107

CMD ["node", "build/index.js"]
