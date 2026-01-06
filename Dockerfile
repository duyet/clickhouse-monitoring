ARG GITHUB_SHA
ARG GITHUB_REF

FROM oven/bun:1-alpine AS base
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --prod

# Rebuild the source code only when needed
FROM base AS builder
ENV NODE_ENV=production \
    GITHUB_SHA=${GITHUB_SHA} \
    GITHUB_REF=${GITHUB_REF}

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
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

COPY --from=deps /app/node_modules /app/node_modules
COPY --from=builder /app/public/* ./
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static

USER app

EXPOSE 3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
