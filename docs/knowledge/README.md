---
id: knowledge-index
title: Internal Knowledge Index
type: index
status: active
updated: 2026-05-09
tags:
  - ai-agent
  - knowledge-graph
related:
  - automation-core-memory
  - rust-wasm-performance
  - component-ci-stability
source_pr: 1021
---

# Internal Knowledge Index

This folder stores internal notes for future AI agents. These notes are not
user-facing product docs. They capture decisions, evidence, and follow-up
context that should survive a compacted chat or a handoff.

## Notes

- [Rust and WASM Performance](./rust-wasm-performance.md)
- [Component CI Stability](./component-ci-stability.md)
- [Automation Core Memory](./core-memory.md)

## Graph Convention

Use frontmatter for machine-readable edges:

- `id`: stable node id
- `type`: `index`, `decision`, `incident`, `workflow`, or `reference`
- `related`: other note ids
- `source_pr`: GitHub PR number when the note came from a PR
- `tags`: search and grouping hints

Also link related notes in the body so plain markdown readers can follow the
same graph without special tooling.
