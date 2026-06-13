# Plan 008: Fix Precision Loss on Numeric Strings with Leading Zeros in ch-json Rust Core

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 3fba89acc..HEAD -- rust/ch-json/src/lib.rs`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (requires Rust build and WASM compilation)
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `3fba89acc`, 2026-06-13

## Why this matters

The `ch-json` Rust library processes ClickHouse raw JSON responses in a high-performance stream. It converts stringified numbers (e.g. `"123"`) into JSON numeric tokens (e.g. `123`) to optimize client-side parsing. 

Currently, the helper function `is_numeric_string` permits leading zeros in string values (such as `"001"`). Because of this, it normalizes `"001"` to `1`. This causes permanent precision/data alteration for stringified numeric codes (like zip codes, database IDs, or month strings like `"09"`) by stripping their leading zeros. Fixing the parser to reject leading-zero strings as numeric tokens prevents this data loss.

## Current state

The file `rust/ch-json/src/lib.rs` implements `is_numeric_string`:

```rust
// rust/ch-json/src/lib.rs:132-150
fn is_numeric_string(value: &str) -> bool {
    if value.is_empty() {
        return false;
    }

    let bytes = value.as_bytes();
    let mut index = 0;

    if bytes.get(index) == Some(&b'-') {
        index += 1;
    }

    let digits_start = index;
    while bytes.get(index).is_some_and(u8::is_ascii_digit) {
        index += 1;
    }
    if index == digits_start {
        return false;
    }
```

And contains an assertion in the unit tests expecting `"leading_zero":1`:

```rust
// rust/ch-json/src/lib.rs:188-198
          {"small":"456","leading_zero":"001","list":["1","2.5","text"]}
        "#;
        let output = transform_clickhouse_json_each_row(input);
        assert!(output.contains(r#""123":"key stays string""#));
        assert!(output.contains(r#""small":123"#));
        assert!(output.contains(r#""large":"9007199254740992""#));
        assert!(output.contains(r#""value":-3"#));
        assert!(output.contains(r#""list":[1,2.5,"text"]"#));
        assert!(output.contains(r#""leading_zero":1"#));
```

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Install   | `bun install` | exit 0 |
| Rust Test | `cd rust/ch-json && cargo test` | exit 0, all tests pass |
| WASM Build| `bun run wasm:build` (from root) or `cd apps/dashboard-tsr && bun run build` | compiles WASM assets successfully |

## Scope

**In scope** (the only files you should modify):
- `rust/ch-json/src/lib.rs`

**Out of scope**:
- Other rust crates or JS-side parser files.

## Git workflow

- Branch: `advisor/008-fix-rust-leading-zeros-normalizer`
- Commit message: `fix(rust/ch-json): prevent normalization of numeric strings with leading zeros`
- Co-authorship footer:
  ```
  Co-Authored-By: duyetbot <bot@duyet.net>
  ```

## Steps

### Step 1: Reject leading zeros in is_numeric_string

Open [lib.rs](file:///Users/duet/project/clickhouse-monitor/rust/ch-json/src/lib.rs). Replace the initial digit loop in `is_numeric_string` with a check that rejects a leading zero followed by other digits (standard JSON number syntax does not permit leading zeros).

Replace lines 144-150:
```rust
    let digits_start = index;
    while bytes.get(index).is_some_and(u8::is_ascii_digit) {
        index += 1;
    }
    if index == digits_start {
        return false;
    }
```

With:
```rust
    let digits_start = index;
    
    // Check if the first digit is '0'. In JSON numbers, a leading zero is only valid 
    // if it is the only digit or followed by a decimal point/exponent.
    if bytes.get(index) == Some(&b'0') {
        index += 1;
        if index < bytes.len() && bytes[index].is_ascii_digit() {
            return false; // Leading zero followed by another digit is not a valid JSON number
        }
    } else {
        while bytes.get(index).is_some_and(u8::is_ascii_digit) {
            index += 1;
        }
    }
    
    if index == digits_start {
        return false;
    }
```

### Step 2: Update the unit tests

In [lib.rs](file:///Users/duet/project/clickhouse-monitor/rust/ch-json/src/lib.rs) lines 188-198, the test asserts that `"leading_zero":"001"` becomes `"leading_zero":1`. Update this assertion to verify that leading zero strings are preserved as strings.

Replace line 197:
```rust
        assert!(output.contains(r#""leading_zero":1"#));
```
With:
```rust
        assert!(output.contains(r#""leading_zero":"001""#));
```

**Verify**: Run `cd rust/ch-json && cargo test` to verify that all rust unit tests pass.

### Step 3: Rebuild the WASM binary

Rebuild the Rust monitor core WASM library so the JavaScript dashboard uses the updated lexer:
- From the root, run: `bun run wasm:build` (if defined in root package.json, otherwise see workspace build scripts) or run the build command inside the app. Let's check `package.json` for WASM build command.
Wait! In the root package.json, `wasm:build` runs `bun --filter dashboard wasm:build`.

**Verify**: Make sure the WASM compilation completes successfully.

## Test plan

- Run `cd rust/ch-json && cargo test` and confirm all tests pass.
- Run `bun run wasm:test` or the corresponding WASM integration tests to verify the binary integration.

## Done criteria

- [ ] Cargo test suite passes.
- [ ] WASM rebuilds successfully.
- [ ] Numeric strings with leading zeros (e.g. `"001"`) are preserved exactly as strings.
- [ ] `plans/README.md` status row updated.

## STOP conditions

- If compiling the Rust crate fails.
- If rebuilding the WASM file breaks TypeScript type definitions or runtime imports in the dashboard.

## Maintenance notes

- Any modification to `rust/ch-json` requires rebuilding the compiled WASM binary.
