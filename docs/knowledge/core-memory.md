---
id: core-memory
title: Automation Core Memory
type: workflow
status: active
updated: 2026-05-13
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
- Dead-code evidence: `rg -n "\b<SYMBOL>\b" --glob '!**/__tests__/**' --glob '!**/*.test.*' --glob '!**/*.spec.*'`
- Main CI status: `gh run list --branch main --limit 10 --json workflowName,status,conclusion,headSha,url`

## Repo Notes

- `AGENTS.md` is a symlink to `CLAUDE.md`; edit `CLAUDE.md` to keep both in sync
- `/docs` route reads source files from `docs/content` through `app/(docs)/docs/_lib/docs.ts`
- Verify dead-code claims with zero non-test references before deleting symbols

## Latest Update

- 2026-05-13: validate `hostId` for dashboard settings API and remove unused docs export type
- 2026-05-13: removed unused `getDocsSlugs` and memoized `getDocsPage` with React `cache`
