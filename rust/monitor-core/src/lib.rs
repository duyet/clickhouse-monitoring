use serde::{Deserialize, Serialize};
use std::collections::{BTreeSet, HashMap};
use wasm_bindgen::prelude::*;

const MAX_SAFE_INTEGER: i128 = 9_007_199_254_740_991;

#[wasm_bindgen]
pub fn transform_clickhouse_json_each_row_json(input: &str) -> Result<String, JsValue> {
    Ok(transform_clickhouse_json_each_row(input))
}

pub fn transform_clickhouse_json_each_row(input: &str) -> String {
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
    output
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
            Some(value.to_string())
        } else {
            None
        }
    })
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

#[derive(Deserialize)]
struct UserEventRow {
    event_time: Option<serde_json::Value>,
    user: Option<serde_json::Value>,
    count: Option<serde_json::Value>,
}

#[derive(Serialize)]
pub struct UserEventOutput {
    data: serde_json::Map<String, serde_json::Value>,
    users: Vec<String>,
    #[serde(rename = "chartData")]
    chart_data: Vec<serde_json::Map<String, serde_json::Value>>,
}

fn stringify_val(v: Option<serde_json::Value>) -> String {
    match v {
        Some(serde_json::Value::String(s)) => s,
        Some(other) => other.to_string(),
        None => String::new(),
    }
}

fn to_count(v: Option<serde_json::Value>) -> f64 {
    match v {
        Some(serde_json::Value::Number(n)) => n.as_f64().unwrap_or(0.0),
        Some(serde_json::Value::String(s)) => s.parse::<f64>().unwrap_or(0.0),
        _ => 0.0,
    }
}

pub fn transform_user_event_counts(input: &str, time_field: &str) -> UserEventOutput {
    let rows: Vec<UserEventRow> = match serde_json::from_str(input) {
        Ok(r) => r,
        Err(_) => {
            return UserEventOutput {
                data: serde_json::Map::new(),
                users: Vec::new(),
                chart_data: Vec::new(),
            }
        }
    };

    transform_user_event_rows(rows, time_field)
}

fn transform_user_event_rows(rows: Vec<UserEventRow>, time_field: &str) -> UserEventOutput {
    let mut user_set = BTreeSet::new();
    let mut time_order = Vec::new();
    let mut nested: HashMap<String, HashMap<String, f64>> = HashMap::new();

    for row in rows {
        let event_time = stringify_val(row.event_time);
        let raw_user = stringify_val(row.user);
        let user = if raw_user.trim().is_empty() {
            "(empty)".to_string()
        } else {
            raw_user
        };
        let count = to_count(row.count);

        user_set.insert(user.clone());
        if !nested.contains_key(&event_time) {
            time_order.push(event_time.clone());
        }
        nested.entry(event_time).or_default().insert(user, count);
    }

    let users: Vec<String> = user_set.into_iter().collect();

    let mut data = serde_json::Map::new();
    let mut chart_data = Vec::with_capacity(nested.len());
    for time in time_order {
        let Some(counts) = nested.get(&time) else {
            continue;
        };

        let mut data_counts = serde_json::Map::new();
        let mut entry = serde_json::Map::new();
        entry.insert(
            time_field.to_string(),
            serde_json::Value::String(time.clone()),
        );

        for user in &users {
            if let Some(count) = counts.get(user) {
                let value = serde_json::Value::from(*count);
                data_counts.insert(user.clone(), value.clone());
                entry.insert(user.clone(), value);
            }
        }

        data.insert(time, serde_json::Value::Object(data_counts));
        chart_data.push(entry);
    }

    UserEventOutput {
        data,
        users,
        chart_data,
    }
}

/// WASM export returning JsValue directly — avoids JSON string intermediate.
#[wasm_bindgen(js_name = transform_user_event_counts_v2)]
pub fn transform_user_event_counts_v2(input: &str, time_field: &str) -> Result<JsValue, JsValue> {
    let result = transform_user_event_counts(input, time_field);
    serde_wasm_bindgen::to_value(&result).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// WASM export accepting JsValue input and returning JsValue output — zero JSON string overhead.
/// JS side: pass pre-parsed array directly, get result object directly.
#[wasm_bindgen(js_name = transform_user_event_counts_v3)]
pub fn transform_user_event_counts_v3(
    input: JsValue,
    time_field: &str,
) -> Result<JsValue, JsValue> {
    let rows: Vec<UserEventRow> =
        serde_wasm_bindgen::from_value(input).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let result = transform_user_event_rows(rows, time_field);
    serde_wasm_bindgen::to_value(&result).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Legacy export returning JSON string (kept for backward compat).
#[wasm_bindgen]
pub fn transform_user_event_counts_json(input: &str, time_field: &str) -> String {
    let result = transform_user_event_counts(input, time_field);
    serde_json::to_string(&result).unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::{json, Value};

    #[test]
    fn normalizes_json_each_row_text() {
        let input = r#"
          {"123":"key stays string","small":"123","large":"9007199254740992","nested":{"value":"-3"}}
          {"small":"456","leading_zero":"001","list":["1","2.5","text"]}
        "#;

        let output: Value =
            serde_json::from_str(&transform_clickhouse_json_each_row(input)).expect("valid json");

        assert_eq!(output[0]["small"], json!(123));
        assert_eq!(output[0]["123"], json!("key stays string"));
        assert_eq!(output[0]["large"], json!("9007199254740992"));
        assert_eq!(output[0]["nested"]["value"], json!(-3));
        assert_eq!(output[1]["list"], json!([1, 2.5, "text"]));
        assert_eq!(output[1]["leading_zero"], json!(1));
    }

    #[test]
    fn preserves_escaped_and_unsafe_numeric_strings() {
        let input = r#"{"escaped":"1\n2","float_max":"9007199254740993.0","exp":"1e2"}"#;
        let output: Value =
            serde_json::from_str(&transform_clickhouse_json_each_row(input)).expect("valid json");

        assert_eq!(output[0]["escaped"], json!("1\n2"));
        assert_eq!(output[0]["float_max"], json!("9007199254740993.0"));
        assert_eq!(output[0]["exp"], json!(100));
    }

    #[test]
    fn transforms_user_event_counts() {
        let input = serde_json::json!([
            {"event_time": "2026-01-01 00:00:00", "user": "alice", "count": 5},
            {"event_time": "2026-01-01 00:00:00", "user": "", "count": 3},
            {"event_time": "2026-01-01 01:00:00", "user": "alice", "count": 7},
            {"event_time": "2026-01-01 01:00:00", "user": "bob", "count": "2"},
        ])
        .to_string();

        let result = transform_user_event_counts(&input, "event_time");
        let output: Value =
            serde_json::from_str(&serde_json::to_string(&result).unwrap()).expect("valid json");

        assert_eq!(output["users"], json!(["(empty)", "alice", "bob"]));
        assert_eq!(output["data"]["2026-01-01 00:00:00"]["alice"], json!(5.0));
        assert_eq!(output["data"]["2026-01-01 00:00:00"]["(empty)"], json!(3.0));
        assert_eq!(
            output["chartData"][0]["event_time"],
            json!("2026-01-01 00:00:00")
        );
    }
}
