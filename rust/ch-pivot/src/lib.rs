//! # ch-pivot
//!
//! `ch-pivot` is a high-performance generic data pivoting and aggregation engine for raw datasets.
//!
//! It enables pivoting tabular-like JSON rows (e.g., query results from ClickHouse) into aggregated, structured
//! formats perfect for multi-series charting libraries (like Recharts, Tremor, etc.) without writing custom client-side mapping scripts.

use serde::{Deserialize, Serialize};
use std::collections::{BTreeSet, HashMap};

/// The output of a pivot table aggregation operation.
#[derive(Debug, Serialize, Deserialize)]
pub struct PivotOutput {
    /// A nested map where the outer key is the row key, the inner key is the column key, and the value is the aggregated sum.
    pub data: serde_json::Map<String, serde_json::Value>,
    /// A sorted list of all unique column key names found during the pivoting operation.
    pub columns: Vec<String>,
    /// A flat list of records, with the row key column and each column key represented as active fields.
    /// Perfect drop-in format for charting libraries.
    #[serde(rename = "chartData")]
    pub chart_data: Vec<serde_json::Map<String, serde_json::Value>>,
}

/// Generic pivoting and aggregation engine.
pub struct PivotEngine;

impl PivotEngine {
    /// Pivots a raw dataset by grouping it by a row key, pivoting it by a column key, and summing up a numeric value field.
    ///
    /// # Arguments
    ///
    /// * `rows` - The raw vector of JSON object maps to pivot.
    /// * `row_key` - The field name to group rows by (e.g., `"event_time"`).
    /// * `column_key` - The field name to pivot into columns (e.g., `"user"`).
    /// * `value_key` - The numeric field name to aggregate as sums (e.g., `"count"`).
    /// * `default_column_val` - An optional fallback string if the column key is empty or missing (e.g., `Some("(empty)")`).
    pub fn pivot(
        rows: Vec<serde_json::Map<String, serde_json::Value>>,
        row_key: &str,
        column_key: &str,
        value_key: &str,
        default_column_val: Option<&str>,
    ) -> PivotOutput {
        let mut column_set = BTreeSet::new();
        let mut row_order = Vec::new();
        let mut nested: HashMap<String, HashMap<String, f64>> = HashMap::new();

        for row in rows {
            let row_val = row.get(row_key).map(stringify_val).unwrap_or_default();

            let raw_col = row.get(column_key).map(stringify_val).unwrap_or_default();

            let col_val = if raw_col.trim().is_empty() {
                default_column_val.unwrap_or("(empty)").to_string()
            } else {
                raw_col
            };

            let count_val = row.get(value_key).map(to_count).unwrap_or(0.0);

            column_set.insert(col_val.clone());
            if !nested.contains_key(&row_val) {
                row_order.push(row_val.clone());
            }
            let counts = nested.entry(row_val).or_default();
            *counts.entry(col_val).or_insert(0.0) += count_val;
        }

        let columns: Vec<String> = column_set.into_iter().collect();

        let mut data = serde_json::Map::new();
        let mut chart_data = Vec::with_capacity(nested.len());

        for row_ident in row_order {
            let Some(counts) = nested.get(&row_ident) else {
                continue;
            };

            let mut data_counts = serde_json::Map::new();
            let mut entry = serde_json::Map::new();
            entry.insert(
                row_key.to_string(),
                serde_json::Value::String(row_ident.clone()),
            );

            for col in &columns {
                if let Some(count) = counts.get(col) {
                    let value = serde_json::Value::from(*count);
                    data_counts.insert(col.clone(), value.clone());
                    entry.insert(col.clone(), value);
                }
            }

            data.insert(row_ident, serde_json::Value::Object(data_counts));
            chart_data.push(entry);
        }

        PivotOutput {
            data,
            columns,
            chart_data,
        }
    }
}

// === Specialized user event metrics wrappers (maintaining 100% backward compatibility) ===

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct UserEventRow {
    pub event_time: Option<serde_json::Value>,
    pub user: Option<serde_json::Value>,
    pub count: Option<serde_json::Value>,
}

/// The output structures expected by Next.js client for user events dashboard.
#[derive(Debug, Serialize, Deserialize)]
pub struct UserEventOutput {
    pub data: serde_json::Map<String, serde_json::Value>,
    pub users: Vec<String>,
    #[serde(rename = "chartData")]
    pub chart_data: Vec<serde_json::Map<String, serde_json::Value>>,
}

/// Pivots a raw JSON string of user event logs.
pub fn transform_user_event_counts(
    input: &str,
    time_field: &str,
) -> serde_json::Result<UserEventOutput> {
    let rows: Vec<UserEventRow> = serde_json::from_str(input)?;
    Ok(transform_user_event_rows(rows, time_field))
}

/// Pivots pre-parsed user event rows.
pub fn transform_user_event_rows(rows: Vec<UserEventRow>, time_field: &str) -> UserEventOutput {
    // Standardize to raw generic map structures for PivotEngine
    let generic_rows: Vec<serde_json::Map<String, serde_json::Value>> = rows
        .into_iter()
        .map(|row| {
            let mut map = serde_json::Map::new();
            if let Some(time) = row.event_time {
                map.insert(time_field.to_string(), time);
            }
            if let Some(user) = row.user {
                map.insert("user".to_string(), user);
            }
            if let Some(count) = row.count {
                map.insert("count".to_string(), count);
            }
            map
        })
        .collect();

    let pivoted = PivotEngine::pivot(generic_rows, time_field, "user", "count", Some("(empty)"));

    UserEventOutput {
        data: pivoted.data,
        users: pivoted.columns,
        chart_data: pivoted.chart_data,
    }
}

// === Helper Functions ===

fn stringify_val(v: &serde_json::Value) -> String {
    match v {
        serde_json::Value::String(s) => s.clone(),
        other => other.to_string(),
    }
}

fn to_count(v: &serde_json::Value) -> f64 {
    match v {
        serde_json::Value::Number(n) => n.as_f64().unwrap_or(0.0),
        serde_json::Value::String(s) => s.parse::<f64>().unwrap_or(0.0),
        _ => 0.0,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn transforms_user_event_counts_successfully() {
        let input = serde_json::json!([
            {"event_time": "2026-01-01 00:00:00", "user": "alice", "count": 5},
            {"event_time": "2026-01-01 00:00:00", "user": "alice", "count": 2},
            {"event_time": "2026-01-01 00:00:00", "user": "", "count": 3},
            {"event_time": "2026-01-01 01:00:00", "user": "alice", "count": 7},
            {"event_time": "2026-01-01 01:00:00", "user": "bob", "count": "2"},
        ])
        .to_string();

        let result = transform_user_event_counts(&input, "event_time").expect("valid rows");
        assert_eq!(result.users, vec!["(empty)", "alice", "bob"]);
        assert_eq!(result.data["2026-01-01 00:00:00"]["alice"], json!(7.0));
        assert_eq!(result.data["2026-01-01 00:00:00"]["(empty)"], json!(3.0));
        assert_eq!(
            result.chart_data[0]["event_time"],
            json!("2026-01-01 00:00:00")
        );
    }

    #[test]
    fn generic_pivot_engine_works() {
        let input = vec![
            json!({"date": "2026-05-20", "metric": "cpu", "value": 45.2})
                .as_object()
                .unwrap()
                .clone(),
            json!({"date": "2026-05-20", "metric": "cpu", "value": 5.8})
                .as_object()
                .unwrap()
                .clone(),
            json!({"date": "2026-05-20", "metric": "memory", "value": 82.0})
                .as_object()
                .unwrap()
                .clone(),
        ];

        let result = PivotEngine::pivot(input, "date", "metric", "value", None);
        assert_eq!(result.columns, vec!["cpu", "memory"]);
        assert_eq!(result.data["2026-05-20"]["cpu"], json!(51.0));
        assert_eq!(result.data["2026-05-20"]["memory"], json!(82.0));
    }
}
