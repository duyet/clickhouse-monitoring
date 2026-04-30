use std::collections::{BTreeMap, BTreeSet};
use std::io::{self, Read};

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

#[derive(Debug, Deserialize)]
struct Row {
    event_time: Option<Value>,
    user: Option<Value>,
    count: Option<Value>,
}

#[derive(Debug, Serialize)]
struct Output {
    data: BTreeMap<String, BTreeMap<String, f64>>,
    users: Vec<String>,
    chart_data: Vec<Map<String, Value>>,
}

fn stringify(v: Option<Value>) -> String {
    match v {
        Some(Value::String(s)) => s,
        Some(other) => other.to_string(),
        None => String::new(),
    }
}

fn to_count(v: Option<Value>) -> f64 {
    match v {
        Some(Value::Number(n)) => n.as_f64().unwrap_or(0.0),
        Some(Value::String(s)) => s.parse::<f64>().unwrap_or(0.0),
        _ => 0.0,
    }
}

fn transform(rows: Vec<Row>, time_field: &str) -> Output {
    let mut user_set = BTreeSet::new();
    let mut nested: BTreeMap<String, BTreeMap<String, f64>> = BTreeMap::new();

    for row in rows {
        let event_time = stringify(row.event_time);
        let raw_user = stringify(row.user);
        let user = if raw_user.trim().is_empty() {
            "(empty)".to_string()
        } else {
            raw_user
        };
        let count = to_count(row.count);

        user_set.insert(user.clone());
        nested.entry(event_time).or_default().insert(user, count);
    }

    let users: Vec<String> = user_set.into_iter().collect();

    let mut chart_data = Vec::with_capacity(nested.len());
    for (time, counts) in &nested {
        let mut entry = Map::new();
        entry.insert(time_field.to_string(), Value::String(time.clone()));
        for (u, c) in counts {
            entry.insert(u.clone(), Value::from(*c));
        }
        chart_data.push(entry);
    }

    Output {
        data: nested,
        users,
        chart_data,
    }
}

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let payload: Value = serde_json::from_str(&input).expect("invalid json payload");

    let rows: Vec<Row> = serde_json::from_value(payload.get("data").cloned().unwrap_or(Value::Array(vec![])))
        .expect("data must be array");
    let time_field = payload
        .get("timeField")
        .and_then(|v| v.as_str())
        .unwrap_or("event_time");

    let out = transform(rows, time_field);
    println!("{}", serde_json::to_string(&out).unwrap());
}
