---
id: core-memory
title: Automation Core Memory
type: workflow
status: active
updated: 2026-05-18
tags:
  - automation
  - code-smell
  - dead-code
  - docs
related:
  - conventions
  - deployment
---

# Automation Core Memory

Durable code-smell/dead-code automation memory. Do not create dated files under `docs/reviews/code-smell-dead-code-*.md`.

## Commands

- Since last run: `git log --since='<ISO_TIME>' --name-only --pretty=format: | sed '/^$/d' | sort -u`
- Fallback window (24h): `git log --since='24 hours ago' --name-only --pretty=format: | sed '/^$/d' | sort -u`
- Fallback window (7d): `git log --since='7 days ago' --name-only --pretty=format: | sed '/^$/d' | sort -u`
- Empty-window rule: if since-last-run has zero commits, run 24h then 7d fallback and report no-op when both are empty
- Dead-code evidence: `rg -n "\b<SYMBOL>\b" --glob '!**/__tests__/**' --glob '!**/*.test.*' --glob '!**/*.spec.*'`
- Main CI status: `gh run list --branch main --limit 10 --json workflowName,status,conclusion,headSha,url`
- Failed-job logs (restricted cache env): `XDG_CACHE_HOME=/private/tmp/gh-cache gh run view <RUN_ID> --job <JOB_ID> --log-failed`
- Cloudflare worker size dry-run: `bun wrangler deploy --minify --dry-run`

## Repo Notes

- `AGENTS.md` is a symlink to `CLAUDE.md`; edit `CLAUDE.md` to keep both in sync
- `/docs` route reads source files from `docs/content` through `app/(docs)/docs/_lib/docs.ts`
- Verify dead-code claims with zero non-test references before deleting symbols
- Docker build must install full deps (`bun install --frozen-lockfile --ignore-scripts`) because `lib/platform/adapters/cloudflare.ts` imports `@opennextjs/cloudflare` during `bun run build`
- If automation checkout is detached (`git status --short --branch` shows `HEAD (no branch)`) or `.git/worktrees/...` writes fail (`FETCH_HEAD`/`HEAD.lock`), move commit/PR operations to `/Users/duet/project/clickhouse-monitor`

## Latest Update

- 2026-05-13: validate `hostId` for dashboard settings API and remove unused docs export type
- 2026-05-13: removed unused `getDocsSlugs` and memoized `getDocsPage` with React `cache`
- 2026-05-14: removed four zero-reference dead-code candidates from recent auth/deploy changes (`HeaderClient`, `getClerkPublishableKey`, `SemverRange`, `QueryConfigNoName`)
- 2026-05-15: fixed Docker CI break by skipping Husky in production install (`HUSKY=0 bun install --production`) and removed global SQL validator mock from `helpers.test.ts` to avoid cross-suite pollution
- 2026-05-15: follow-up Docker fix uses `bun install --production --ignore-scripts` because Bun still executes root `prepare`; agent route tests now set `LLM_API_KEY`/`LLM_MODEL` in `beforeEach` to avoid provider-preflight `503` from ambient CI env
- 2026-05-16: fixed `Image build and Push` failures on main (`Module not found: Can't resolve '@opennextjs/cloudflare'`) by removing Docker `--production` install in the deps stage while keeping `--ignore-scripts`
- 2026-05-17: automation run started on detached worktree (`HEAD (no branch)`), so branch/PR work should pivot to `/Users/duet/project/clickhouse-monitor` when git metadata writes fail in `.git/worktrees/...`
- 2026-05-18: no commits since last run timestamp; 24h fallback was empty, 7d fallback used for evidence-only audit with no new actionable code-smell/dead-code/perf findings
