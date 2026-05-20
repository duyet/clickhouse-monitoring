ARG GITHUB_SHA=${GITHUB_SHA:-unknown}
ARG GITHUB_REF=${GITHUB_REF:-unknown}

FROM oven/bun:1-alpine AS base
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

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

# Copy dependencies from deps stage (avoid reinstalling)
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application (wasm:build is skipped by next.config.ts when WASM files exist)
RUN bun run build

# Production image, copy all the files and run next
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 app && \
    adduser --system --uid 1001 app && \
    mkdir .next && \
    chown app:app .next

# IMPORTANT: .next/standalone already contains all necessary production dependencies
# DO NOT copy node_modules from deps stage - this causes 438MB+ duplication
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public

USER app

EXPOSE 3000

# Copy migration files for auto-migration at startup
COPY --from=builder --chown=app:app /app/lib/migration ./lib/migration
COPY --from=builder --chown=app:app /app/lib/conversation-store/pg-migrations ./lib/conversation-store/pg-migrations

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
# Auto-migration runs on first API request via autoMigrate() singleton
CMD ["node", "server.js"]
