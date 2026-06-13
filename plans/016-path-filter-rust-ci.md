# Plan 016: Remove Redundant Rust Toolchain Setup from Frontend CI Workflows

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 3fba89acc..HEAD -- .github/workflows/test.yml .github/workflows/cloudflare.yml`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dependencies
- **Planned at**: commit `3fba89acc`, 2026-06-13

## Why this matters

The dashboard app uses a high-performance Rust core compiled to WASM. Because the compiled WASM binary assets are already pre-built and checked directly into the git repository, the frontend build scripts do not compile any Rust code from scratch during test or deployment runs. 

However, multiple jobs in `.github/workflows/test.yml` and `.github/workflows/cloudflare.yml` still set up the Rust toolchain (`dtolnay/rust-toolchain`) unconditionally on every run. This adds ~30-60 seconds of unnecessary overhead to every frontend CI run, wasting GitHub Actions runner minutes. Removing these redundant steps will speed up the CI pipeline.

## Current state

The workflow `.github/workflows/test.yml` has the following Rust installation steps:
- Job `unit-tests`, line 45-46
- Job `e2e-test`, line 142-143

The workflow `.github/workflows/cloudflare.yml` has the following Rust installation steps:
- Job `preview`, line 60-61
- Job `production`, line 463-464

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Verify yml| `actionlint .github/workflows/test.yml` (if available) | no syntax errors |

## Scope

**In scope** (the only files you should modify):
- `.github/workflows/test.yml`
- `.github/workflows/cloudflare.yml`

**Out of scope**:
- Modifications to `.github/workflows/cli-rust-ci.yml` (which is the dedicated workflow that compiles and tests Rust core code and *must* retain the Rust toolchain setup).

## Git workflow

- Branch: `advisor/016-path-filter-rust-ci`
- Commit message: `ci: remove redundant rust toolchain installation from frontend workflows`
- Co-authorship footer:
  ```
  Co-Authored-By: duyetbot <bot@duyet.net>
  ```

## Steps

### Step 1: Remove Rust toolchain setup from test.yml

Open [.github/workflows/test.yml](file:///Users/duet/project/clickhouse-monitor/.github/workflows/test.yml). 
1. Delete lines 45-46 in the `unit-tests` job:
   ```yaml
         - name: Setup Rust
           uses: dtolnay/rust-toolchain@1.94.0
   ```
2. Delete lines 142-143 in the `e2e-test` job:
   ```yaml
         - name: Setup Rust
           uses: dtolnay/rust-toolchain@1.94.0
   ```

### Step 2: Remove Rust toolchain setup from cloudflare.yml

Open [.github/workflows/cloudflare.yml](file:///Users/duet/project/clickhouse-monitor/.github/workflows/cloudflare.yml).
1. Delete lines 60-61 in the `preview` job:
   ```yaml
         - name: Setup Rust
           uses: dtolnay/rust-toolchain@1.94.0
   ```
2. Delete lines 463-464 in the `production` job:
   ```yaml
         - name: Setup Rust
           uses: dtolnay/rust-toolchain@1.94.0
   ```

## Test plan

- Push changes to a branch and monitor the CI run. Ensure that the workflows parse correctly and run successfully without requesting or setting up the Rust compiler.

## Done criteria

- [ ] All modified workflow files are syntactically valid YAML.
- [ ] CI runs successfully on push.
- [ ] `plans/README.md` status row updated.

## STOP conditions

- If any build step fails due to missing cargo/rust commands (ensure that the JS/TS code is actually loading the precompiled WASM from Git rather than compiling at build time).
