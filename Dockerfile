# Production Dockerfile for Desert Falcon IPSC Club
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install build tools required for native C++ modules (better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

# ----------------------------------------------------
# Production Runtime Stage
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV DF_DATA_DIR=/app/data
ENV DF_TRUST_PROXY=1
ENV DF_SECURE_COOKIES=0

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY server.js db.js lib.js training-logic.js ./
COPY public ./public
COPY scripts ./scripts

# Persistent storage mount point for SQLite database and photos
VOLUME ["/app/data"]

EXPOSE 3000

CMD ["node", "server.js"]
