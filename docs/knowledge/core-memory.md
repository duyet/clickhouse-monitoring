---
id: automation-core-memory
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
  - knowledge-index
artifacts:
  - CLAUDE.md
  - app/(docs)/docs/_lib/docs.ts
---

# Automation Core Memory

Use this note for durable code-smell/dead-code automation memory in this repo.
Do not create dated files under `docs/reviews/code-smell-dead-code-*.md`.

## Commands

- Since last run: `git log --since='<ISO_TIME>' --name-only --pretty=format: | sed '/^$/d' | sort -u`
- Fallback window: `git log --since='24 hours ago' --name-only --pretty=format: | sed '/^$/d' | sort -u`
- Dead-code evidence: `rg -n "\\b<SYMBOL>\\b" --glob '!**/*.test.*' --glob '!**/*.spec.*'`

## Repo Notes

- `AGENTS.md` is a symlink to `CLAUDE.md`; edit `CLAUDE.md` to keep both in sync.
- `/docs` route reads source files from `docs/content` through `app/(docs)/docs/_lib/docs.ts`.
- Verify dead-code claims with zero non-test references before deleting symbols.

## Latest Update

- 2026-05-13: removed unused `getDocsSlugs` and memoized `getDocsPage` with React `cache` to avoid repeated docs file read/parse work for the same slug during server render and metadata generation.
