use std::{collections::HashMap, fs, io, path::PathBuf, time::Duration};

use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use comfy_table::{presets::UTF8_FULL, Table};
use crossterm::{
    event, execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::{
    layout::{Constraint, Direction, Layout},
    widgets::{Block, Borders, Paragraph, Row, Sparkline, Table as TuiTable},
    Terminal,
};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Deserialize, Serialize, Default)]
struct FileConfig {
    base_url: Option<String>,
    host_id: Option<u32>,
    api_key: Option<String>,
    default_chart: Option<String>,
}

#[derive(Parser, Debug)]
#[command(name = "chm", version, about = "ClickHouse Monitoring CLI")]
struct Cli {
    #[arg(long, env = "CHM_CONFIG")]
    config: Option<PathBuf>,
    #[arg(long, env = "CHM_BASE_URL")]
    base_url: Option<String>,
    #[arg(long, env = "CHM_HOST_ID")]
    host_id: Option<u32>,
    #[arg(long, env = "CHM_API_KEY")]
    api_key: Option<String>,
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand, Debug)]
enum Commands {
    Hosts,
    Chart { name: String, #[arg(long, default_value_t = 20)] limit: usize },
    Table { name: String, #[arg(long, default_value_t = 20)] limit: usize },
    Tui { chart: Option<String> },
}

#[derive(Debug, Deserialize)]
struct ApiResponse {
    data: Value,
}

#[derive(Debug, Clone)]
struct AppConfig {
    base_url: String,
    host_id: u32,
    api_key: Option<String>,
    default_chart: String,
}

fn default_config_path() -> Option<PathBuf> {
    dirs::home_dir().map(|h| h.join(".config/chm/config.toml"))
}

fn load_file_config(path: Option<PathBuf>) -> FileConfig {
    let p = path.or_else(default_config_path);
    if let Some(path) = p {
        if path.exists() {
            let content = fs::read_to_string(path).unwrap_or_default();
            return toml::from_str(&content).unwrap_or_default();
        }
    }
    FileConfig::default()
}

fn resolve_config(cli: &Cli) -> AppConfig {
    let file = load_file_config(cli.config.clone());
    AppConfig {
        base_url: cli
            .base_url
            .clone()
            .or(file.base_url)
            .unwrap_or_else(|| "http://localhost:3000".to_string()),
        host_id: cli.host_id.or(file.host_id).unwrap_or(0),
        api_key: cli.api_key.clone().or(file.api_key),
        default_chart: file.default_chart.unwrap_or_else(|| "query-count".to_string()),
    }
}

async fn fetch(client: &Client, url: String, api_key: Option<&str>) -> Result<Value> {
    let mut req = client.get(url);
    if let Some(k) = api_key {
        req = req.header("x-api-key", k);
    }
    let resp = req.send().await?.error_for_status()?;
    let parsed: ApiResponse = resp.json().await?;
    Ok(parsed.data)
}

fn print_records(data: &[HashMap<String, Value>], limit: usize) {
    let mut table = Table::new();
    table.load_preset(UTF8_FULL);
    if let Some(first) = data.first() {
        let headers: Vec<String> = first.keys().cloned().collect();
        table.set_header(headers.clone());
        for row in data.iter().take(limit) {
            let cells = headers
                .iter()
                .map(|k| row.get(k).map_or("".into(), |v| v.to_string()))
                .collect::<Vec<_>>();
            table.add_row(cells);
        }
    }
    println!("{table}");
}

async fn run_tui(client: &Client, cfg: &AppConfig, chart: &str) -> Result<()> {
    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen)?;
    let backend = ratatui::backend::CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    loop {
        let url = format!("{}/api/v1/charts/{}?hostId={}", cfg.base_url, chart, cfg.host_id);
        let data = fetch(client, url, cfg.api_key.as_deref())
            .await
            .unwrap_or(Value::Array(vec![]));
        let rows = data.as_array().cloned().unwrap_or_default();
        let points: Vec<u64> = rows
            .iter()
            .take(80)
            .map(|r| {
                r.as_object()
                    .and_then(|o| o.values().find_map(|v| v.as_u64()))
                    .unwrap_or(0)
            })
            .collect();

        terminal.draw(|f| {
            let chunks = Layout::default()
                .direction(Direction::Vertical)
                .constraints([Constraint::Length(3), Constraint::Min(5)].as_ref())
                .split(f.area());
            f.render_widget(
                Paragraph::new(format!(
                    "chm tui | chart={chart} | q=quit | host={} | resize supported",
                    cfg.host_id
                )),
                chunks[0],
            );
            let rows_widget: Vec<Row> = rows
                .iter()
                .take(10)
                .filter_map(|r| r.as_object())
                .map(|o| {
                    let kv = o
                        .iter()
                        .map(|(k, v)| format!("{k}:{v}"))
                        .collect::<Vec<_>>()
                        .join(" | ");
                    Row::new(vec![kv])
                })
                .collect();
            let inner = Layout::default()
                .direction(Direction::Vertical)
                .constraints([Constraint::Length(5), Constraint::Min(5)])
                .split(chunks[1]);
            let spark = Sparkline::default()
                .block(Block::default().title("Trend").borders(Borders::ALL))
                .data(&points);
            f.render_widget(spark, inner[0]);
            let table = TuiTable::new(rows_widget, [Constraint::Percentage(100)])
                .block(Block::default().title("Recent rows").borders(Borders::ALL));
            f.render_widget(table, inner[1]);
        })?;

        if event::poll(Duration::from_millis(250))? {
            match event::read()? {
                event::Event::Key(k) if matches!(k.code, event::KeyCode::Char('q')) => break,
                event::Event::Resize(_, _) => continue,
                _ => {}
            }
        }
    }

    disable_raw_mode()?;
    execute!(terminal.backend_mut(), LeaveAlternateScreen)?;
    Ok(())
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();
    let cfg = resolve_config(&cli);
    let client = Client::builder().timeout(Duration::from_secs(20)).build()?;

    match cli.command {
        Commands::Hosts => {
            let url = format!("{}/api/v1/hosts", cfg.base_url);
            let data = fetch(&client, url, cfg.api_key.as_deref()).await?;
            let hosts: Vec<HashMap<String, Value>> =
                serde_json::from_value(data).context("hosts payload parse failed")?;
            print_records(&hosts, 100);
        }
        Commands::Chart { name, limit } => {
            let url = format!("{}/api/v1/charts/{}?hostId={}", cfg.base_url, name, cfg.host_id);
            let data = fetch(&client, url, cfg.api_key.as_deref()).await?;
            let rows: Vec<HashMap<String, Value>> =
                serde_json::from_value(data).context("chart payload parse failed")?;
            print_records(&rows, limit);
        }
        Commands::Table { name, limit } => {
            let url = format!(
                "{}/api/v1/tables/{}?hostId={}&pageSize={}",
                cfg.base_url, name, cfg.host_id, limit
            );
            let data = fetch(&client, url, cfg.api_key.as_deref()).await?;
            let rows: Vec<HashMap<String, Value>> =
                serde_json::from_value(data).context("table payload parse failed")?;
            print_records(&rows, limit);
        }
        Commands::Tui { chart } => {
            let c = chart.unwrap_or(cfg.default_chart.clone());
            run_tui(&client, &cfg, &c).await?
        }
    }

    Ok(())
}
