# 03 — Blog v0.3 stat strip: keep facts, drop deck-vibe

## Problem

`apps/blog/src/content/blog/chmonitor-v0-3.md` opens with a 4-up stat strip:
`8 new features · 70+ fixes · 13 perf wins · 71 charts`. The numbers are real,
but the bare big-number/label grid reads like a pitch-deck slide — the one
"marketing-deck" tell the redesign audit flagged.

## Goal

Keep the factual numbers (they're true and useful) but present them as a calm,
factual line rather than a hype stat-grid — consistent with the post's
sentence-case, plain-language voice.

## Decision needed (low stakes — default chosen)

Default: **soften, don't delete.** Convert the stat-row into a single quiet
sentence under the launch film caption, e.g.:

> v0.3 lands 8 new features, 70+ fixes, 13 performance wins, and 71 charts.

Drop the `.stat-row`/`.stat` block (and its now-unused CSS in the blog
`Base.astro` if nothing else uses it — verify first, remove only our own orphan).

## Real test

This is prose; the "test" is a build + content assertion:
- `cd apps/blog && bun run build` succeeds.
- Built post HTML no longer contains `class="stat-row"` and DOES contain the new
  sentence. (A grep assertion in the verification step, not a unit test.)

## Verification

```
cd apps/blog && bun run build
grep -c 'stat-row' apps/blog/dist/**/index.html   # → 0
```

## Note

If the unused `.stat-row`/`.stat` CSS is shared/used elsewhere, leave it
(surgical: remove only orphans we create).
