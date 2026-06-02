ARG GITHUB_SHA=${GITHUB_SHA:-unknown}
ARG GITHUB_REF=${GITHUB_REF:-unknown}

FROM oven/bun:1-alpine AS base
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat
COPY package.json bun.lock ./
COPY packages/ ./packages/
# All workspace member manifests must be present for --frozen-lockfile install.
COPY apps/dashboard/package.json ./apps/dashboard/package.json
COPY apps/mcp/package.json ./apps/mcp/package.json
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --ignore-scripts

# Rebuild the source code only when needed
FROM base AS builder
ARG SKIP_RUST=false
ENV NODE_ENV=production \
    GITHUB_SHA=${GITHUB_SHA} \
    GITHUB_REF=${GITHUB_REF}

# Install Rust only when building WASM from source
RUN if [ "$SKIP_RUST" = "false" ]; then \
      set -o pipefail && apk add --no-cache build-base curl && \
      curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain 1.94.0; \
    fi
ENV PATH="/root/.cargo/bin:${PATH}"

# Copy dependencies from deps stage (avoid reinstalling).
# Bun hoists all workspace deps to the root node_modules (with @chm/* symlinks),
# so there is no apps/dashboard/node_modules to copy — workspace resolution walks up.
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build only the dashboard app via turbo. The standalone Astro apps
# (apps/landing, apps/docs) are not workspace members and ship as separate
# Cloudflare Workers, so they are never part of the Docker image.
# wasm:build is skipped by next.config.ts when WASM files exist.
RUN bun run build --filter=dashboard

# Production image, copy all the files and run next
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 app && \
    adduser --system --uid 1001 app && \
    mkdir -p apps/dashboard/.next && \
    chown -R app:app apps

# IMPORTANT: .next/standalone already contains all necessary production dependencies
# DO NOT copy node_modules from deps stage - this causes 438MB+ duplication
#
# With outputFileTracingRoot inferred at the monorepo root, the standalone output
# nests the server under apps/dashboard/. Copying the whole standalone dir preserves that
# nesting, so server.js lands at ./apps/dashboard/server.js and static/public must sit
# relative to it (./apps/dashboard/.next/static and ./apps/dashboard/public).
COPY --from=builder --chown=app:app /app/apps/dashboard/.next/standalone ./
COPY --from=builder --chown=app:app /app/apps/dashboard/.next/static ./apps/dashboard/.next/static
COPY --from=builder --chown=app:app /app/apps/dashboard/public ./apps/dashboard/public

USER app

EXPOSE 3000

# Copy migration files for auto-migration at startup
COPY --from=builder --chown=app:app /app/apps/dashboard/lib/migration ./apps/dashboard/lib/migration
COPY --from=builder --chown=app:app /app/apps/dashboard/lib/conversation-store/pg-migrations ./apps/dashboard/lib/conversation-store/pg-migrations

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
# With the monorepo tracing root, server.js is nested under apps/dashboard/.
# Auto-migration runs on first API request via autoMigrate() singleton
CMD ["bun", "apps/dashboard/server.js"]
