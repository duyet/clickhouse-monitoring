---
id: rust-wasm-performance
title: Rust and WASM Performance (PR 1021)
type: decision
status: active
updated: 2026-05-09
source_pr: 1021
source_branch: codex/implement-data-logic-in-rust-and-update-pr
tags:
  - rust
  - wasm
  - benchmark
  - performance
  - clickhouse-jsoneachrow
related:
  - knowledge-index
  - component-ci-stability
artifacts:
  - scripts/bench-wasm.ts
  - scripts/build-wasm.ts
  - rust/monitor-core
  - lib/wasm/monitor-core.ts
  - lib/wasm/generated/monitor_core_bg.wasm
  - tools/user-events-rs
  - tools/ch-monitor-cli/src/main.rs
---

# Rust and WASM Performance

This note records the benchmark decision for PR #1021. See the
[knowledge index](./README.md) and the related
[component CI stability note](./component-ci-stability.md).

## Decision

Keep object-heavy transforms in TypeScript. Use Rust/WASM only for
JSON-preserving or byte/string-heavy paths where data can stay serialized
across the JS/WASM boundary.

Do not promote native Rust subprocess transforms into hot API paths. Process
startup and IPC overhead dominate the benchmark for small and medium inputs.

## Current PR Description Graph

The PR description tracks total large-input speedup for the JSON-preserving
production candidates:

- `clickhouse-jsoneachrow-to-json`
- `chart-api-response-envelope`

The graph metric is intentionally narrow. It excludes object-returning WASM and
native CLI subprocess transforms because those paths were rejected by benchmark
evidence.

## Latest Rerun

Command:

```bash
bun run bench:wasm
```

Latest rerun on May 1, 2026:

| Candidate | Size | TS ms | Candidate ms | Speedup | Promote |
|---|---:|---:|---:|---:|---|
| clickhouse-jsoneachrow-to-objects | large | 183.30 | 205.58 | 0.89x | no |
| clickhouse-jsoneachrow-to-json | large | 188.25 | 158.73 | 1.19x | no |
| chart-api-response-envelope | large | 190.31 | 164.56 | 1.16x | no |
| clickhouse-jsoneachrow-native-cli | large | 176.85 | 148.65 | 1.19x | no |

The latest run only promoted `clickhouse-jsoneachrow-to-json/small` at 1.28x.
Large JSON-preserving paths were still faster in total, but below the 1.20x
promotion threshold on this run.

## Historical Context

Earlier benchmark comments on PR #1021 showed:

- JSONEachRow normalization reached roughly parity to 1.2x faster.
- User-event object pivots were much slower in WASM v1/v2/v3.
- Rust CLI subprocess transforms were not viable for hot browser/API paths.

## Handoff Rules

- Re-run `bun run bench:wasm` after changing `rust/monitor-core`,
  `lib/wasm/monitor-core.ts`, or `scripts/bench-wasm.ts`.
- Update the PR description graph if benchmark totals move materially.
- Keep the promotion threshold at 1.20x unless the reviewer asks for a
  different threshold.
- Preserve lazy loading for the WASM bundle. Do not add it to default dashboard
  or client bundles.
- For `tools/ch-monitor-cli`, keep TUI refresh cadence bounded. The current
  target is one chart fetch every five seconds, with `r` for manual refresh.
- TUI sparkline values should accept integers, floats, and numeric strings, and
  should prefer explicit metric keys before falling back to the first numeric
  field.
