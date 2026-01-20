# BabyNest Web App - Production Dockerfile
# Multi-stage build for optimized production image

# ============================================================================
# Stage 1: Builder
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy all source code first
COPY . .

# Install all dependencies (this ensures proper workspace resolution)
RUN npm ci

# Build shared packages first
RUN npm run build -w @babynest/types || true

# Build the Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w web

# ============================================================================
# Stage 2: Production
# ============================================================================
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

USER nextjs

EXPOSE 3000

# Start the Next.js server
CMD ["node", "apps/web/server.js"]
