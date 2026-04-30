# Standalone ClickHouse Monitoring CLI (Rust)

`tools/ch-monitor-cli` provides a standalone CLI that talks to the existing API.

## Why these libs
- `clap`: mature CLI parser with env support
- `reqwest` + `tokio`: stable async HTTP stack
- `comfy-table`: clean table rendering
- `ratatui` + `crossterm`: best-in-class Rust TUI stack

## Config loading
CLI loads config from (in order):
1. `--config /path/to/config.toml`
2. `CHM_CONFIG`
3. default file `~/.config/chm/config.toml`
4. direct flags/env override file values

Example config:
```toml
base_url = "http://localhost:3000"
host_id = 0
api_key = "chm_xxx"
default_chart = "query-count"
```

## Commands
```bash
cargo run --manifest-path tools/ch-monitor-cli/Cargo.toml -- hosts
cargo run --manifest-path tools/ch-monitor-cli/Cargo.toml -- chart query-count --limit 50
cargo run --manifest-path tools/ch-monitor-cli/Cargo.toml -- table running-queries --limit 30
cargo run --manifest-path tools/ch-monitor-cli/Cargo.toml -- tui query-count
```

## API key support
- CLI sends `x-api-key` header when `api_key` is configured.
- Server-side API key protection is enabled when `CHM_API_KEY_SECRET` is set.
- Generate key via API:

```bash
curl -X POST http://localhost:3000/api/v1/auth/api-key \
  -H 'content-type: application/json' \
  -d '{"label":"cli","days":30}'
```

## TUI resize support
TUI redraws using current terminal area and handles resize events (`Event::Resize`).

## CI flow
`cli-rust-ci.yml` runs on PR and push (CLI path only): fmt, clippy, build, test.

## Release process
Tag format: `chm-v*` (example `chm-v0.1.0`).

`cli-rust-release.yml` builds Linux/macOS binaries and uploads to GitHub Release.
