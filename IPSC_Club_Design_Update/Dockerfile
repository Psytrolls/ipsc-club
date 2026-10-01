# Multi-stage Dockerfile for Desert Falcon IPSC Web Application
FROM node:22-slim AS builder

WORKDIR /app

# Copy package specifications
COPY package*.json ./

# Install all dependencies for build
RUN npm ci

# Copy source files
COPY . .

# Build frontend and server bundles
RUN npm run build

# ----------------------------------------------------
# Production Runtime Image (Debian-based for workerd glibc compatibility)
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV DATA_DIR=/app/data
ENV APP_ORIGIN=https://ipsc.magavnegev.co.il

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built artifacts and necessary server files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/server ./server
COPY --from=builder /app/scripts ./scripts

# Persistent storage mount point
VOLUME ["/app/data"]

EXPOSE 3000

CMD ["node", "server/standalone-server.mjs"]
