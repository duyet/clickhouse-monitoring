# Root Dockerfile — builds apps/dashboard (TanStack Start, the primary app).
# Built from the repo root (context: .) so apps/dashboard/, the workspace-root
# bun.lock, and the shared packages/ sources (resolved via ../../ Vite aliases)
# are all reachable.
ARG GITHUB_SHA=unknown
ARG GITHUB_REF=unknown

FROM oven/bun:1-alpine AS base
WORKDIR /app

# ── builder ──────────────────────────────────────────────────────────────────
# apps/dashboard is a root workspace member (its deps are resolved via the root
# bun.lock, like apps/mcp), so install the whole workspace from the repo root.
# A frozen install needs every workspace member's package.json present.
FROM base AS builder
ARG GITHUB_SHA
ARG GITHUB_REF
ENV NODE_ENV=production \
    GITHUB_SHA=${GITHUB_SHA} \
    GITHUB_REF=${GITHUB_REF} \
    BUILD_TARGET=node
RUN apk add --no-cache libc6-compat
COPY package.json bun.lock tsconfig.base.json ./
COPY apps/dashboard/package.json ./apps/dashboard/
COPY apps/mcp/package.json ./apps/mcp/
COPY packages/ ./packages/
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --ignore-scripts
# App sources copied after install so the dependency layer caches across source-only changes.
COPY apps/dashboard/ ./apps/dashboard/
WORKDIR /app/apps/dashboard
# BUILD_TARGET=node switches vite.config.ts to the Nitro node-server preset,
# emitting a self-contained bundle at .output/server/index.mjs.
#
# Use the build:node:ci wrapper, NOT a bare `vite build`: the prerender crawl
# finishes writing `.output` but the process never exits (nitro's in-process
# render server leaves a ref'd socket open), which would hang `RUN` until the
# CI/Docker timeout. The wrapper detects completion (prerender marker + on-disk
# artifacts) and reaps the lingering process group, exiting cleanly.
RUN bun run build:node:ci

# ── runner ─────────────────────────────────────────────────────────────────
# The Nitro node-server output is a plain Node bundle — run on node:24-alpine
# (smaller than the bun image, no runtime deps needed beyond .output).
FROM node:24-alpine AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0
RUN apk add --no-cache libc6-compat curl && \
    addgroup -S -g 1001 app && \
    adduser -S -u 1001 -G app app && \
    mkdir -p /app && \
    chown -R app:app /app
WORKDIR /app
COPY --from=builder --chown=app:app /app/apps/dashboard/.output ./
USER app
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=20s \
  CMD curl -sf http://localhost:3000/api/healthz || exit 1
CMD ["node", "server/index.mjs"]
