# MCP Server

The ClickHouse Monitor exposes a [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server at `/api/mcp`. This allows AI assistants like Claude, Cursor, and other MCP-compatible clients to interact with your ClickHouse cluster programmatically.

## Why MCP?

MCP provides a standardized way for AI tools to access your ClickHouse data. Instead of copying query results manually, an AI assistant can directly:

- Explore your database schema
- Run read-only queries
- Investigate slow queries and performance issues
- Check server health and running operations

## Available Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `query` | Execute a read-only SQL query | `sql` (string, required) |
| `list_databases` | List all databases with engines and comments | `hostId` (number, optional, default: 0) |
| `list_tables` | List tables in a database with row counts and sizes | `database` (string, required), `hostId` (number, optional, default: 0) |
| `get_table_schema` | Show columns, types, defaults, and comments for a table | `database` (string, required), `table` (string, required), `hostId` (number, optional, default: 0) |
| `get_metrics` | Get server version, uptime, and active connections | `hostId` (number, optional, default: 0) |
| `get_running_queries` | List currently executing queries ordered by elapsed time | `hostId` (number, optional, default: 0) |
| `get_slow_queries` | Get slowest completed queries from query log | `limit` (number, optional, default: 10), `hostId` (number, optional, default: 0) |
| `get_merge_status` | Get currently running merge operations with progress | `hostId` (number, optional, default: 0) |

## Setup

### Claude Desktop

Add to your `claude_desktop_config.json`:

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

1. Open **Settings > MCP > Add Server**
2. Enter the endpoint URL: `https://your-deployment.example.com/api/mcp`

### Other MCP Clients

Point any MCP-compatible client to your deployment's `/api/mcp` endpoint.

### Testing

```bash
curl -X POST https://your-deployment.example.com/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

## Example Usage

Once connected, you can ask your AI assistant things like:

- "Show me all databases and their sizes"
- "What are the slowest queries in the last hour?"
- "Describe the schema of the `events` table in the `analytics` database"
- "Are there any currently running queries that look stuck?"
- "How many rows does each table in the `default` database have?"

The AI assistant will use the MCP tools to query your ClickHouse cluster and return the results.

## Security Notes

- **Read-only access**: All MCP tools execute read-only operations. No data modification is possible through the MCP interface.
- **No authentication**: The MCP endpoint inherits the same authentication as your ClickHouse Monitor deployment. For local development, no additional auth is required. For production deployments, secure the endpoint using your deployment platform's access controls (e.g., Cloudflare Access, VPN, reverse proxy auth).
- **Query limits**: Queries executed through MCP respect the same `CLICKHOUSE_MAX_EXECUTION_TIME` timeout as the dashboard.
- **No sensitive data exposure**: The MCP server uses the same ClickHouse credentials configured for the dashboard. It does not expose credentials to MCP clients.
