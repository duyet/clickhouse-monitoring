---
id: knowledge-index
title: Internal Knowledge Index
type: index
status: active
updated: 2026-05-01
tags:
  - ai-agent
  - knowledge-graph
related:
  - pr-1021-rust-wasm-performance
  - pr-1021-component-ci-stability
source_pr: 1021
---

# Internal Knowledge Index

This folder stores internal notes for future AI agents. These notes are not
user-facing product docs. They capture decisions, evidence, and follow-up
context that should survive a compacted chat or a handoff.

## Notes

- [PR 1021 Rust and WASM Performance](./pr-1021-rust-wasm-performance.md)
- [PR 1021 Component CI Stability](./pr-1021-component-ci-stability.md)

## Graph Convention

Use frontmatter for machine-readable edges:

- `id`: stable node id
- `type`: `index`, `decision`, `incident`, `workflow`, or `reference`
- `related`: other note ids
- `source_pr`: GitHub PR number when the note came from a PR
- `tags`: search and grouping hints

Also link related notes in the body so plain markdown readers can follow the
same graph without special tooling.
