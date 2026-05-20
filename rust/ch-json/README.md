# ch-json

`ch-json` is an ultra-fast raw ClickHouse JSON-each-row parsing and precision normalization library for Rust.

[![Crates.io](https://img.shields.io/crates/v/ch-json.svg)](https://crates.io/crates/ch-json)
[![Docs.rs](https://docs.rs/ch-json/badge.svg)](https://docs.rs/ch-json)
[![License](https://img.shields.io/badge/license-MIT%20OR%20Apache--2.0-blue.svg)](LICENSE)

## The Problem

ClickHouse commonly returns 64-bit integer, 128-bit integer, 256-bit integer, or decimal fields (e.g. `Int64`, `UInt64`, `Int128`, `Int256`, `Decimal`). When exporting query results to JSON (such as in `JSONEachRow` format), ClickHouse typically outputs 64-bit integers as strings to prevent precision loss in client-side Javascript engines.

Standard JavaScript engines (including browsers, Node.js, and Cloudflare Workers) parse JSON numbers into 64-bit floats. Any integer larger than $2^{53} - 1$ (`9,007,199,254,740,991` or `MAX_SAFE_INTEGER`) suffers from silent float precision loss.

However, displaying all integers as strings in JSON can bloat files, complicate client-side charting libraries (which expect numbers for plotting), and prevent standard clients from performing mathematical operations easily.

## The Solution

`ch-json` parses raw ClickHouse JSON lines, inspects stringified numeric values, and safely normalizes them back to raw JSON numbers **only if** they are within JavaScript's safe numeric boundary (`[-9007199254740991, 9007199254740991]`).

If the number exceeds this boundary, it is left intact as a string so that JavaScript clients do not lose precision.

This library achieves:
* **Zero Allocations & High-Performance:** Raw byte-level parsing directly processes the string slice line-by-line.
* **Safe Boundaries:** Hardcoded boundary check for `i128::abs() <= 9_007_199_254_740_991` for integers, and standard float parsing boundaries.
* **Preserves Syntax:** Safely ignores object keys, escaped sequences, and non-numeric string values.

## Installation

Add `ch-json` to your `Cargo.toml`:

```toml
[dependencies]
ch-json = "0.1"
```

## Quick Start

```rust
use ch_json::transform_clickhouse_json_each_row;

fn main() {
    let raw_clickhouse_json = r#"
        {"id":"123","large_val":"9007199254740992","label":"user_clicks"}
        {"id":"456","large_val":"9007199254740990","label":"user_views"}
    "#;

    let normalized = transform_clickhouse_json_each_row(raw_clickhouse_json);
    
    // Output is a fully-formed JSON array, safe for direct JavaScript parsing!
    // Notice "123" and "9007199254740990" are normalized to raw numbers, 
    // but "9007199254740992" is preserved as a string to avoid JS precision loss.
    assert_eq!(
        normalized,
        r#"[{"id":123,"large_val":"9007199254740992","label":"user_clicks"},{"id":456,"large_val":9007199254740990,"label":"user_views"}]"#
    );
}
```

## License

Licensed under either of:

* Apache License, Version 2.0 ([LICENSE-APACHE](LICENSE-APACHE) or http://www.apache.org/licenses/LICENSE-2.0)
* MIT license ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)

at your option.
