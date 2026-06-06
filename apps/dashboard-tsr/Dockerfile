# Dockerfile — Node/Docker target for the TanStack Start dashboard (#1409).
# Built from the REPO ROOT (context: .) so both apps/dashboard-tsr/ and the
# shared packages/ sources (resolved via ../../ Vite aliases) are reachable.
#   docker build -f apps/dashboard-tsr/Dockerfile -t chmonitor-dash-tsr .
ARG GITHUB_SHA=unknown
ARG GITHUB_REF=unknown

FROM oven/bun:1-alpine AS base
WORKDIR /app

# ── deps ──────────────────────────────────────────────────────────────────
# Install only the isolated app's own dependencies (own bun.lock; NOT a root
# workspace member). packages/ is copied so bun can resolve the transitive deps
# of @chm/clickhouse-client (@clickhouse/client-web, lru-cache, zod) during the
# frozen install.
FROM base AS deps
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat
COPY apps/dashboard-tsr/package.json apps/dashboard-tsr/bun.lock ./apps/dashboard-tsr/
COPY packages/ ./packages/
WORKDIR /app/apps/dashboard-tsr
RUN --mount=type=cache,id=bun-tsr,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --ignore-scripts

# ── builder ────────────────────────────────────────────────────────────────
FROM base AS builder
ARG GITHUB_SHA
ARG GITHUB_REF
ENV NODE_ENV=production \
    GITHUB_SHA=${GITHUB_SHA} \
    GITHUB_REF=${GITHUB_REF} \
    BUILD_TARGET=node
COPY --from=deps /app/apps/dashboard-tsr/node_modules /app/apps/dashboard-tsr/node_modules
# packages/ is needed at build time for the @chm/* source aliases (../../).
COPY packages/ /app/packages/
COPY apps/dashboard-tsr/ /app/apps/dashboard-tsr/
WORKDIR /app/apps/dashboard-tsr
# BUILD_TARGET=node switches vite.config.ts to the Nitro node-server preset,
# emitting a self-contained bundle at .output/server/index.mjs.
RUN BUILD_TARGET=node bun run build:node

# ── runner ─────────────────────────────────────────────────────────────────
# The Nitro node-server output is a plain Node bundle — run on node:22-alpine
# (smaller than the bun image, no runtime deps needed beyond .output).
FROM node:24-alpine AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0
RUN apk add --no-cache libc6-compat && \
    addgroup --system --gid 1001 app && \
    adduser --system --uid 1001 app
WORKDIR /app
COPY --from=builder --chown=app:app /app/apps/dashboard-tsr/.output ./
USER app
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=20s \
  CMD wget -q -O /dev/null http://localhost:3000/api/healthz || exit 1
CMD ["node", "server/index.mjs"]
