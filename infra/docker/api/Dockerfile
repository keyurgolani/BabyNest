# BabyNest API Dockerfile
# Multi-stage build for optimized production image

# ============================================================================
# Stage 1: Builder
# ============================================================================
FROM node:20-alpine AS builder

# Install dependencies required for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy all source code first
COPY . .

# Install all dependencies (this ensures proper workspace resolution)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma --config=apps/api/prisma.config.ts

# Build shared packages first
RUN npm run build -w @babynest/types

# Build the API
RUN npm run build -w @babynest/api

# ============================================================================
# Stage 2: Production
# ============================================================================
FROM node:20-alpine AS production

# Install dependencies required for bcrypt runtime and database connectivity check
RUN apk add --no-cache python3 make g++ netcat-openbsd openssl openssl-dev

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy package files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages/types/package.json ./packages/types/

# Copy built application
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Copy built types package (required dependency)
COPY --from=builder /app/packages/types/dist ./packages/types/dist

# Copy node_modules
COPY --from=builder /app/node_modules ./node_modules

# Copy entrypoint script
COPY infra/docker/api/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Set ownership
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Set working directory to api
WORKDIR /app/apps/api

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health/live || exit 1

# Use entrypoint for migrations, then start the application
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
