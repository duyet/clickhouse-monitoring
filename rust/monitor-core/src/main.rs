use std::io::{self, Read};

fn main() {
    if let Err(err) = run() {
        eprintln!("{err}");
        std::process::exit(1);
    }
}

fn run() -> Result<(), Box<dyn std::error::Error>> {
    let mut args = std::env::args();
    let command = args.nth(1).unwrap_or_default();
    if command != "normalize-json-each-row" {
        return Err("usage: monitor-core normalize-json-each-row [input.jsonl]".into());
    }

    let input = if let Some(path) = args.next() {
        std::fs::read_to_string(path)?
    } else {
        let mut input = String::new();
        io::stdin().read_to_string(&mut input)?;
        input
    };
    let output = monitor_core::transform_clickhouse_json_each_row(&input);
    println!("{output}");

    Ok(())
}
