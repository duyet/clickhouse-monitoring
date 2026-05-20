# ch-pivot

`ch-pivot` is a high-performance generic data pivoting and aggregation engine for raw datasets.

[![Crates.io](https://img.shields.io/crates/v/ch-pivot.svg)](https://crates.io/crates/ch-pivot)
[![Docs.rs](https://docs.rs/ch-pivot/badge.svg)](https://docs.rs/ch-pivot)
[![License](https://img.shields.io/badge/license-MIT%20OR%20Apache--2.0-blue.svg)](LICENSE)

## The Problem

When fetching time-series logs or event tables from databases like ClickHouse, data is typically returned as a flat list of records (tabular format):

| event_time | user | count |
|------------|------|-------|
| 2026-05-20 | alice| 5     |
| 2026-05-20 | bob  | 2     |
| 2026-05-21 | alice| 7     |

To visualize this in charting libraries (like Recharts, Tremor, or Chart.js) as a multi-series chart, the frontend expects a **pivoted, aggregated structure** grouped by time where each user is an independent field:

```json
[
  { "event_time": "2026-05-20", "alice": 5, "bob": 2 },
  { "event_time": "2026-05-21", "alice": 7 }
]
```

Doing this reshaping and aggregation in JavaScript is CPU-intensive, messy, and prone to bugs when dealing with large datasets or complex groupings.

## The Solution

`ch-pivot` implements a highly optimized, generic pivoting engine in Rust. It:
1. Reshapes dynamic tabular rows into grouped records.
2. Automatically aggregates sums for missing/duplicate keys.
3. Dynamically identifies and sorts all distinct column categories.
4. Generates data outputs ready for both direct mapping lookups and flat charting formats.

## Installation

Add `ch-pivot` to your `Cargo.toml`:

```toml
[dependencies]
ch-pivot = "0.1"
```

## Quick Start

### 1. Generic Pivoting

Using the generic `PivotEngine`, you can pivot any arbitrary dataset of JSON-like objects:

```rust
use ch_pivot::PivotEngine;
use serde_json::json;

fn main() {
    let dataset = vec![
        json!({"date": "2026-05-20", "metric": "cpu", "value": 45.2}).as_object().unwrap().clone(),
        json!({"date": "2026-05-20", "metric": "cpu", "value": 5.8}).as_object().unwrap().clone(),
        json!({"date": "2026-05-20", "metric": "memory", "value": 82.0}).as_object().unwrap().clone(),
    ];

    let output = PivotEngine::pivot(
        dataset, 
        "date",     // Group by key
        "metric",   // Pivot column key
        "value",    // Aggregation value key
        None        // Optional fallback label
    );

    // Sorted column names found
    assert_eq!(output.columns, vec!["cpu", "memory"]);

    // Flat data ready for charts
    assert_eq!(
        output.chart_data[0],
        json!({
            "date": "2026-05-20",
            "cpu": 51.0,
            "memory": 82.0
        }).as_object().unwrap().clone()
    );
}
```

### 2. Specialized Event Pivoting

The crate also includes a high-performance specialized wrapper `transform_user_event_counts` for standard logs/events tracking:

```rust
use ch_pivot::transform_user_event_counts;

fn main() {
    let raw_json_logs = r#"[
        {"event_time": "2026-01-01 00:00:00", "user": "alice", "count": 5},
        {"event_time": "2026-01-01 00:00:00", "user": "bob", "count": 2},
        {"event_time": "2026-01-01 01:00:00", "user": "alice", "count": 7}
    ]"#;

    let result = transform_user_event_counts(raw_json_logs, "event_time").unwrap();
    
    println!("Unique users found: {:?}", result.users);
    println!("Chart-ready dataset: {:?}", result.chart_data);
}
```

## License

Licensed under either of:

* Apache License, Version 2.0 ([LICENSE-APACHE](LICENSE-APACHE) or http://www.apache.org/licenses/LICENSE-2.0)
* MIT license ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)

at your option.
