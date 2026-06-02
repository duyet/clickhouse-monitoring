# Tables API

The Tables API provides access to all available table query configurations in the ClickHouse monitoring application.

## Endpoint

```
GET /api/v1/tables/[name]
```

## Parameters

### Path Parameters

- `name` (required): The name of the query configuration to execute

### Query Parameters

- `hostId` (required): The host identifier to execute the query against (numeric or string)
- Additional parameters: Any query-specific parameters defined in the query configuration

## Response Format

### Success Response

```json
{
  "success": true,
  "data": [...],
  "metadata": {
    "queryId": "abc123",
    "duration": 150,
    "rows": 42,
    "host": "localhost"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "type": "table_not_found",
    "message": "Table query configuration not found: invalid-name",
    "details": {
      "availableTables": "backups, clusters, columns, ..."
    }
  },
  "metadata": {
    "queryId": "",
    "duration": 0,
    "rows": 0,
    "host": "unknown"
  }
}
```

## Error Types

- `validation_error`: Missing or invalid request parameters
- `table_not_found`: Query configuration not found
- `query_error`: Error executing the query
- `network_error`: Network or connection error
- `permission_error`: Permission or authentication error

## Examples

### Basic Query

Fetch cluster information:

```bash
curl "http://localhost:3000/api/v1/tables/clusters?hostId=0"
```

### Parameterized Query

Fetch columns for a specific database and table:

```bash
curl "http://localhost:3000/api/v1/tables/columns?hostId=0&database=default&table=users"
```

### Query with Defaults

Fetch database disk usage (uses default database='default'):

```bash
curl "http://localhost:3000/api/v1/tables/database-disk-usage-by-database?hostId=0"
```

Override the default:

```bash
curl "http://localhost:3000/api/v1/tables/database-disk-usage-by-database?hostId=0&database=system"
```

## Available Tables

To get a complete list of available tables, see the table registry at `/lib/api/table-registry.ts`.

Common tables include:

### General Tables
- `clusters` - Cluster information
- `disks` - Disk space information
- `database-disk-usage` - Database disk usage
- `database-disk-usage-by-database` - Disk usage by database (requires `database` param)

### Table Management
- `tables-overview` - Overview of all tables
- `replicas` - Replication status
- `replication-queue` - Replication queue entries
- `detached-parts` - Detached table parts
- `projections` - Table projections
- `distributed-ddl-queue` - Distributed DDL queue

### Query Monitoring
- `running-queries` - Currently running queries
- `history-queries` - Query history
- `failed-queries` - Failed queries
- `expensive-queries` - Most expensive queries by duration
- `expensive-queries-by-memory` - Most expensive queries by memory
- `common-errors` - Common query errors
- `query-cache` - Query cache statistics

### Merges and Mutations
- `merges` - Active merge operations
- `merge-performance` - Merge performance statistics
- `mutations` - Active mutations

### Settings and Configuration
- `settings` - ClickHouse settings
- `mergetree-settings` - MergeTree engine settings
- `users` - User accounts
- `roles` - User roles

### Monitoring and Metrics
- `metrics` - Current metrics
- `asynchronous-metrics` - Asynchronous metrics
- `backups` - Backup logs (optional, requires backup configuration)
- `errors` - Error logs (optional, requires error logging)
- `zookeeper` - ZooKeeper/ClickHouse Keeper information (optional)
- `page-views` - Page view statistics (optional, custom table)

### Usage Statistics
- `top-usage-tables` - Most frequently accessed tables
- `top-usage-columns` - Most frequently accessed columns

### Specific Queries
- `columns` - Column information (requires `database` and `table` params)
- `count-across-replicas` - Replica counts (requires `cluster` param)

## Cache Headers

Successful responses include cache headers:

```
Cache-Control: public, s-maxage=30, stale-while-revalidate=60
```

- Results are cached for 30 seconds
- Stale results can be served for up to 60 seconds while revalidating

## Optional Tables

Some tables are marked as optional and may not exist depending on ClickHouse configuration:

- `backups`: Requires backup configuration
- `errors`: Requires error logging configuration
- `zookeeper`: Requires ZooKeeper/ClickHouse Keeper setup
- `page-views`: Custom monitoring table

If an optional table doesn't exist, you'll receive a user-friendly error message explaining the requirement.
