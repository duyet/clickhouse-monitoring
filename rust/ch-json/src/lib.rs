//! # ch-json
//!
//! `ch-json` is an ultra-fast raw JSON-each-row parsing and precision normalization library for ClickHouse.
//!
//! ClickHouse often returns extremely large `Int64`, `UInt64`, `Int128`, `Int256`, or `Decimal` values.
//! Since standard JavaScript/JSON parsers lose precision on numbers larger than $2^{53} - 1$ (`MAX_SAFE_INTEGER`),
//! developers often quote 64-bit integers as strings.
//!
//! This library parses the raw JSON line-by-line, inspects stringified numbers, and safely normalizes them back to raw
//! JSON numbers only if they are within Javascript's safe numeric boundaries, avoiding float/integer precision loss.

const MAX_SAFE_INTEGER: i128 = 9_007_199_254_740_991;

/// Normalizes all lines of a ClickHouse JSON-each-row string.
///
/// This parses the raw JSON line-by-line, checks stringified values, and transforms them into standard numeric
/// values where safe, keeping large precision numbers intact as strings.
///
/// # Examples
///
/// ```
/// use ch_json::transform_clickhouse_json_each_row;
///
/// let input = r#"{"small":"123","large":"9007199254740992"}"#;
/// let output = transform_clickhouse_json_each_row(input);
/// assert_eq!(output, r#"[{"small":123,"large":"9007199254740992"}]"#);
/// ```
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

/// Helper function to parse individual JSON elements and normalize numeric strings.
pub fn normalize_json_string_numbers(input: &str, output: &mut String) {
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalizes_json_each_row_text() {
        let input = r#"
          {"123":"key stays string","small":"123","large":"9007199254740992","nested":{"value":"-3"}}
          {"small":"456","leading_zero":"001","list":["1","2.5","text"]}
        "#;

        let output = transform_clickhouse_json_each_row(input);
        assert!(output.contains(r#""123":"key stays string""#));
        assert!(output.contains(r#""small":123"#));
        assert!(output.contains(r#""large":"9007199254740992""#));
        assert!(output.contains(r#""value":-3"#));
        assert!(output.contains(r#""list":[1,2.5,"text"]"#));
        assert!(output.contains(r#""leading_zero":"001""#));
    }

    #[test]
    fn preserves_escaped_and_unsafe_numeric_strings() {
        let input = r#"{"escaped":"1\n2","float_max":"9007199254740993.0","exp":"1e2"}"#;
        let output = transform_clickhouse_json_each_row(input);
        assert!(output.contains(r#""escaped":"1\n2""#));
        assert!(output.contains(r#""float_max":"9007199254740993.0""#));
        assert!(output.contains(r#""exp":100"#));
    }

    #[test]
    fn handles_unbalanced_quotes_gracefully() {
        let input = r#"{"unbalanced":"abc"#;
        let mut output = String::new();
        normalize_json_string_numbers(input, &mut output);
        assert_eq!(output, r#"{"unbalanced":"abc"#);
    }
}
