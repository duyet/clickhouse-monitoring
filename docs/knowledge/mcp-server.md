---
id: mcp-server
title: MCP Server
type: reference
status: active
updated: 2026-05-13
tags:
  - mcp
  - api
  - ai-tools
related:
  - query-config-format
  - deployment
---

# MCP Server

The chmonitor exposes a [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server at `/api/mcp`. Allows AI assistants to interact with ClickHouse clusters programmatically.

## Available Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `query` | Execute read-only SQL query | `sql` (string, required) |
| `list_databases` | List databases with engines and comments | `hostId` (number, optional) |
| `list_tables` | List tables with row counts and sizes | `database` (string, required) |
| `get_table_schema` | Show columns, types, defaults, comments | `database`, `table` (required) |
| `get_metrics` | Server version, uptime, active connections | `hostId` (number, optional) |
| `get_running_queries` | Currently executing queries by elapsed time | `hostId` (number, optional) |
| `get_slow_queries` | Slowest completed queries from query log | `limit` (number, optional) |
| `get_merge_status` | Running merge operations with progress | `hostId` (number, optional) |

## Setup

### Claude Desktop

```json
{
  "mcpServers": {
    "clickhouse-monitor": {
      "url": "https://your-deployment.example.com/api/mcp"
    }
  }
}
```

### Cursor

Settings > MCP > Add Server → endpoint URL

### Testing

```bash
curl -X POST https://your-deployment.example.com/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

## Security

- **Read-only**: All MCP tools execute read-only operations
- **No authentication**: Inherits deployment-level access controls
- **Query limits**: Same `CLICKHOUSE_MAX_EXECUTION_TIME` timeout as dashboard
- **No credential exposure**: Uses dashboard's configured ClickHouse credentials

## Key Files

- `app/api/mcp/route.ts` — MCP endpoint
- `lib/mcp/` — MCP server implementation
- `lib/api/shared/validators/sql.ts` — SQL validation
- Tests: `lib/mcp/__tests__/` using bun:test
