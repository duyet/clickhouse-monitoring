ARG GITHUB_SHA=${GITHUB_SHA:-unknown}
ARG GITHUB_REF=${GITHUB_REF:-unknown}

FROM oven/bun:1-alpine AS base
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
# Add build dependencies for native modules (better-sqlite3 requires python3 and build tools)
RUN apk add --no-cache libc6-compat python3 make g++
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
ENV NODE_ENV=production \
    GITHUB_SHA=${GITHUB_SHA} \
    GITHUB_REF=${GITHUB_REF}

# Copy dependencies from deps stage (avoid reinstalling)
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
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

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
