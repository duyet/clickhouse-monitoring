# Code Smell Detector & Dead Code Hunter - 2026-04-29

Scope: recent changes since the previous automation timestamp
`2026-04-27T21:03:15Z`, through `9f9907e9`.

## Findings

### Info: Biome schema version matched the canonical checkout

- File: `biome.json:2`
- Evidence:
  - The linked automation worktree reported a local schema/CLI drift, but the
    canonical checkout used for commits resolved Biome `2.3.14`.
  - `bun run lint` in `/Users/duet/project/clickhouse-monitor` completed with
    no diagnostics.
- Action: no code change. Updating the schema would create drift in the
  canonical checkout.

### Warning: History-query duration and time presets need product review

- File: `lib/query-config/queries/history-queries.ts:176`
- Evidence:
  - `filterParamPresets` defines `last_hours` presets at
    `lib/query-config/queries/history-queries.ts:176`.
  - `filterParamPresets` defines `min_duration_s` presets at
    `lib/query-config/queries/history-queries.ts:188`.
  - `rg -n "query_duration >= 60|min_duration_s|last_hours|duration_1m" lib/query-config components app`
    shows `min_duration_s` and `last_hours` are used by `slow-queries`, but the
    history query still filters duration with the older `duration_1m` parameter.
- Reason not changed: wiring or removing these presets would change filter
  behavior or hide a visible UI option. This automation only applies fixes that
  do not alter functionality.

## Critical Findings

None.

## Dead Code Review

No confident dead-code removals were made.

- `rg -n "useSettingsShortcut" --glob '!**/*.test.*' --glob '!**/*.cy.*'`
  found live references from both `components/nav-user.tsx` and
  `components/nav-user/clerk-nav.tsx`.
- `rg -n "QueryFiltersBar" --glob '!**/*.test.*' --glob '!**/*.cy.*'`
  found the history-query page entry point reference.
- Helper functions inside recently changed components either had local call
  sites or were component entry points.
