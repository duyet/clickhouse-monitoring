use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use serde_json::{Map, Number, Value};
use std::collections::BTreeSet;
use wasm_bindgen::prelude::*;

const MAX_SAFE_INTEGER: i128 = 9_007_199_254_740_991;

#[wasm_bindgen]
pub fn parse_tables_from_sql_json(sql: &str) -> String {
    serde_json::to_string(&parse_tables_from_sql(sql)).unwrap_or_else(|_| "[]".to_string())
}

#[wasm_bindgen]
pub fn transform_clickhouse_data_json(input: &str) -> Result<String, JsValue> {
    let value: Value =
        serde_json::from_str(input).map_err(|err| JsValue::from_str(&err.to_string()))?;

    match value {
        Value::Array(rows) => {
            let transformed = rows.into_iter().map(transform_value).collect::<Vec<_>>();
            serde_json::to_string(&transformed).map_err(|err| JsValue::from_str(&err.to_string()))
        }
        other => serde_json::to_string(&other).map_err(|err| JsValue::from_str(&err.to_string())),
    }
}

#[wasm_bindgen]
pub fn transform_clickhouse_json_each_row_json(input: &str) -> Result<String, JsValue> {
    transform_clickhouse_json_each_row(input).map_err(|err| JsValue::from_str(&err.to_string()))
}

pub fn transform_clickhouse_json_each_row(input: &str) -> serde_json::Result<String> {
    let mut output = String::with_capacity(input.len() + 2);
    output.push('[');

    let mut is_first = true;
    for line in input.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        if is_first {
            is_first = false;
        } else {
            output.push(',');
        }
        normalize_json_string_numbers(trimmed, &mut output);
    }

    output.push(']');
    Ok(output)
}

fn normalize_json_string_numbers(input: &str, output: &mut String) {
    let bytes = input.as_bytes();
    let mut index = 0;

    while index < bytes.len() {
        if bytes[index] != b'"' {
            output.push(bytes[index] as char);
            index += 1;
            continue;
        }

        let string_start = index;
        index += 1;
        let value_start = index;
        let mut has_escape = false;

        while index < bytes.len() {
            match bytes[index] {
                b'\\' => {
                    has_escape = true;
                    index += 2;
                }
                b'"' => break,
                _ => index += 1,
            }
        }

        if index >= bytes.len() {
            output.push_str(&input[string_start..]);
            return;
        }

        let value_end = index;
        let string_end = index + 1;
        let next_non_whitespace = bytes[string_end..]
            .iter()
            .copied()
            .find(|byte| !byte.is_ascii_whitespace());
        let is_object_key = next_non_whitespace == Some(b':');
        let raw_value = &input[value_start..value_end];

        if !has_escape && !is_object_key {
            if let Some(number) = json_number_for_numeric_string(raw_value) {
                output.push_str(&number);
            } else {
                output.push_str(&input[string_start..string_end]);
            }
        } else {
            output.push_str(&input[string_start..string_end]);
        }

        index = string_end;
    }
}

fn json_number_for_numeric_string(raw: &str) -> Option<String> {
    if !is_numeric_string(raw) {
        return None;
    }

    let has_fraction_or_exponent = raw.contains('.') || raw.contains('e') || raw.contains('E');
    if !has_fraction_or_exponent {
        return raw.parse::<i128>().ok().and_then(|integer| {
            if integer.abs() <= MAX_SAFE_INTEGER {
                Some(integer.to_string())
            } else {
                None
            }
        });
    }

    raw.parse::<f64>().ok().and_then(|value| {
        if value.is_finite() && !(value.fract() == 0.0 && value.abs() > MAX_SAFE_INTEGER as f64) {
            serde_json::to_string(&value).ok()
        } else {
            None
        }
    })
}

#[wasm_bindgen]
pub fn transform_user_event_counts_json(input: &str, time_field: &str) -> Result<String, JsValue> {
    let rows: Vec<UserEventRow> =
        serde_json::from_str(input).map_err(|err| JsValue::from_str(&err.to_string()))?;

    let transformed = transform_user_event_counts(&rows, time_field);
    serde_json::to_string(&transformed).map_err(|err| JsValue::from_str(&err.to_string()))
}

fn parse_tables_from_sql(sql: &str) -> Vec<String> {
    let mut tables = Vec::new();
    let mut seen = BTreeSet::new();
    let tokens = tokenize(sql);

    for (index, token) in tokens.iter().enumerate() {
        if token.eq_ignore_ascii_case("DELETE")
            && tokens
                .get(index + 1)
                .is_some_and(|next| next.eq_ignore_ascii_case("FROM"))
        {
            if let Some(candidate) = tokens.get(index + 2) {
                if is_database_table(candidate) && seen.insert(candidate.clone()) {
                    tables.push(candidate.clone());
                }
            }
            continue;
        }

        if !token.eq_ignore_ascii_case("FROM")
            && !token.eq_ignore_ascii_case("JOIN")
            && !token.eq_ignore_ascii_case("INTO")
            && !token.eq_ignore_ascii_case("UPDATE")
        {
            continue;
        }

        let Some(candidate) = tokens.get(index + 1) else {
            continue;
        };

        if is_database_table(candidate) && seen.insert(candidate.clone()) {
            tables.push(candidate.clone());
        }
    }

    tables
}

fn tokenize(sql: &str) -> Vec<String> {
    let mut tokens = Vec::new();
    let mut current = String::new();

    for ch in sql.chars() {
        if ch.is_ascii_alphanumeric() || ch == '_' || ch == '.' {
            current.push(ch);
        } else if !current.is_empty() {
            tokens.push(std::mem::take(&mut current));
        }
    }

    if !current.is_empty() {
        tokens.push(current);
    }

    tokens
}

fn is_database_table(value: &str) -> bool {
    let Some((database, table)) = value.split_once('.') else {
        return false;
    };

    !database.is_empty()
        && !table.is_empty()
        && !table.contains('.')
        && database.chars().all(is_identifier_char)
        && table.chars().all(is_identifier_char)
}

fn is_identifier_char(ch: char) -> bool {
    ch.is_ascii_alphanumeric() || ch == '_'
}

fn transform_value(value: Value) -> Value {
    match value {
        Value::String(raw) if is_numeric_string(&raw) => parse_number_value(raw),
        Value::Array(items) => Value::Array(items.into_iter().map(transform_value).collect()),
        Value::Object(record) => Value::Object(transform_record(record)),
        other => other,
    }
}

fn transform_record(record: Map<String, Value>) -> Map<String, Value> {
    record
        .into_iter()
        .map(|(key, value)| (key, transform_value(value)))
        .collect()
}

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

    if bytes.get(index) == Some(&b'.') {
        index += 1;
        let fraction_start = index;
        while bytes.get(index).is_some_and(u8::is_ascii_digit) {
            index += 1;
        }
        if index == fraction_start {
            return false;
        }
    }

    if matches!(bytes.get(index), Some(b'e') | Some(b'E')) {
        index += 1;
        if matches!(bytes.get(index), Some(b'+') | Some(b'-')) {
            index += 1;
        }
        let exponent_start = index;
        while bytes.get(index).is_some_and(u8::is_ascii_digit) {
            index += 1;
        }
        if index == exponent_start {
            return false;
        }
    }

    index == bytes.len()
}

fn parse_number_value(raw: String) -> Value {
    let has_fraction_or_exponent = raw.contains('.') || raw.contains('e') || raw.contains('E');

    if !has_fraction_or_exponent {
        if let Ok(integer) = raw.parse::<i128>() {
            if integer.abs() > MAX_SAFE_INTEGER {
                return Value::String(raw);
            }

            if let Ok(value) = i64::try_from(integer) {
                return Value::Number(Number::from(value));
            }
        }
    }

    if let Ok(value) = raw.parse::<f64>() {
        if value.is_finite() && value.fract() == 0.0 && value.abs() > MAX_SAFE_INTEGER as f64 {
            return Value::String(raw);
        }

        if let Some(number) = Number::from_f64(value) {
            return Value::Number(number);
        }
    }

    Value::String(raw)
}

#[derive(Debug, Deserialize)]
struct UserEventRow {
    #[serde(default)]
    event_time: Value,
    #[serde(default)]
    user: Value,
    #[serde(default)]
    count: Value,
}

#[derive(Debug, Serialize)]
struct UserEventCountsTransformed {
    data: IndexMap<String, IndexMap<String, f64>>,
    users: Vec<String>,
    #[serde(rename = "chartData")]
    chart_data: Vec<Map<String, Value>>,
}

fn transform_user_event_counts(
    rows: &[UserEventRow],
    time_field: &str,
) -> UserEventCountsTransformed {
    let mut user_set = BTreeSet::new();
    let mut nested_data: IndexMap<String, IndexMap<String, f64>> = IndexMap::new();

    for row in rows {
        let event_time = value_to_string(&row.event_time);
        let raw_user = value_to_string(&row.user);
        let user = if raw_user.trim().is_empty() {
            "(empty)".to_string()
        } else {
            raw_user
        };
        let count = value_to_number(&row.count);

        user_set.insert(user.clone());
        nested_data
            .entry(event_time)
            .or_default()
            .insert(user, count);
    }

    let users = user_set.into_iter().collect::<Vec<_>>();
    let chart_data = nested_data
        .iter()
        .map(|(time, user_counts)| {
            let mut entry = Map::new();
            entry.insert(time_field.to_string(), Value::String(time.clone()));
            for (user, count) in user_counts {
                if let Some(number) = Number::from_f64(*count) {
                    entry.insert(user.clone(), Value::Number(number));
                }
            }
            entry
        })
        .collect();

    UserEventCountsTransformed {
        data: nested_data,
        users,
        chart_data,
    }
}

fn value_to_string(value: &Value) -> String {
    match value {
        Value::Null => String::new(),
        Value::String(value) => value.clone(),
        Value::Number(value) => value.to_string(),
        Value::Bool(value) => value.to_string(),
        other => other.to_string(),
    }
}

fn value_to_number(value: &Value) -> f64 {
    match value {
        Value::Number(value) => value.as_f64().unwrap_or(f64::NAN),
        Value::String(value) => value.parse::<f64>().unwrap_or(f64::NAN),
        Value::Bool(true) => 1.0,
        _ => 0.0,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn extracts_system_tables_from_sql() {
        let sql = "
            WITH recent_backups AS (
              SELECT * FROM system.backup_log
            )
            SELECT * FROM recent_backups rb
            LEFT JOIN system.tables t ON rb.name = t.name
            WHERE EXISTS (SELECT 1 FROM system.parts p WHERE p.table = t.name)
        ";

        assert_eq!(
            parse_tables_from_sql(sql),
            vec![
                "system.backup_log".to_string(),
                "system.tables".to_string(),
                "system.parts".to_string(),
            ]
        );

        assert_eq!(
            parse_tables_from_sql("DELETE FROM system.query_log WHERE query_id = 'x'"),
            vec!["system.query_log".to_string()]
        );
    }

    #[test]
    fn normalizes_numeric_strings_without_losing_large_ints() {
        let input = json!([
            {
                "small": "123",
                "float": "12.5",
                "large": "9007199254740992",
                "nested": { "value": "-3" }
            }
        ])
        .to_string();

        let output: Value = serde_json::from_str(&transform_clickhouse_data_json(&input).unwrap())
            .expect("valid json");

        assert_eq!(output[0]["small"], json!(123));
        assert_eq!(output[0]["float"], json!(12.5));
        assert_eq!(output[0]["large"], json!("9007199254740992"));
        assert_eq!(output[0]["nested"]["value"], json!(-3));
    }

    #[test]
    fn normalizes_json_each_row_text() {
        let input = r#"
          {"123":"key stays string","small":"123","large":"9007199254740992","nested":{"value":"-3"}}
          {"small":"456","leading_zero":"001","list":["1","2.5","text"]}
        "#;

        let output: Value =
            serde_json::from_str(&transform_clickhouse_json_each_row_json(input).unwrap())
                .expect("valid json");

        assert_eq!(output[0]["small"], json!(123));
        assert_eq!(output[0]["123"], json!("key stays string"));
        assert_eq!(output[0]["large"], json!("9007199254740992"));
        assert_eq!(output[0]["nested"]["value"], json!(-3));
        assert_eq!(output[1]["list"], json!([1, 2.5, "text"]));
        assert_eq!(output[1]["leading_zero"], json!(1));
    }

    #[test]
    fn transforms_user_event_counts() {
        let input = json!([
            { "event_time": "2026-01-01", "user": "alice", "count": 5 },
            { "event_time": "2026-01-01", "user": "", "count": "3" },
            { "event_time": "2026-01-02", "user": "alice", "count": 7 },
            { "event_time": "2026-01-01", "user": "bob", "count": "bad" }
        ])
        .to_string();

        let output: Value =
            serde_json::from_str(&transform_user_event_counts_json(&input, "event_time").unwrap())
                .expect("valid json");

        assert_eq!(output["users"], json!(["(empty)", "alice", "bob"]));
        assert_eq!(output["data"]["2026-01-01"]["alice"], json!(5.0));
        assert_eq!(output["chartData"][0]["event_time"], json!("2026-01-01"));
        assert_eq!(output["data"]["2026-01-01"]["bob"], Value::Null);
        assert_eq!(output["chartData"][0]["bob"], Value::Null);
    }
}
