# Code Smell Detector & Dead Code Hunter - 2026-04-27

Scope: recent changes from the last 7 days on `origin/main` through `a1e6a8d1`.

## Findings Fixed

### Warning: Bun-only project had a root npm lockfile

- File: `package-lock.json:1`
- Evidence:
  - `package.json:47` enforces `npx only-allow bun`.
  - `package.json` declares `packageManager` as `bun@1.3.3`.
  - `.github/workflows/test.yml` and `.github/workflows/cloudflare.yml` install with `bun install`.
  - `rg -n "package-lock|npm ci|npm install" .github .husky scripts package.json README.md CLAUDE.md AGENTS.md` found no workflow use for the root `package-lock.json`.
- Fix: removed the root npm lockfile and kept `bun.lock` as the single root lockfile.

### Info: Unused model metadata helper export

- File: `lib/ai/agent-models.ts:97`
- Evidence:
  - `rg -n "isKnownModel" .` returned only the helper declaration.
  - The helper was introduced in the recently touched shared model metadata module and had no non-test or test references.
- Confidence: confident.
- Fix: removed the unused exported helper.

### Info: New model test import order failed Biome

- File: `lib/ai/agent-models.test.ts:1`
- Evidence:
  - `bun run check ...` reported `assist/source/organizeImports` for `lib/ai/agent-models.test.ts`.
- Fix: sorted imports in the test file.

## Dead Code Review

No additional confident dead-code removals were made. Candidate exports and components in the recently changed files were checked with repo-wide `rg`; all remaining candidates had live references or were route/component entry points.
