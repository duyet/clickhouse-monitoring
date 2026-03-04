# ClickHouse Monitor Agent Skill

An [Agent Skill](https://agentskills.io) for the ClickHouse Monitor dashboard - a real-time monitoring and observability tool for ClickHouse clusters.

## About

Agent Skills are folders of instructions, scripts, and resources that AI agents can discover and use to do things more accurately and efficiently. This skill provides specialized knowledge for:

- **Dashboard navigation** - Overview, queries, tables, merges, metrics, security
- **Query monitoring** - Running queries, history, failures, expensive queries
- **Table management** - Data explorer, replicas, replication queue, projections
- **Merge operations** - Active merges, performance, mutations
- **System metrics** - CPU, memory, disk, connections, settings
- **API integration** - Chart data, table data, database explorer endpoints
- **Development** - Static site patterns, SWR fetching, query configs

## Installation

### Via Skills CLI

Install using the skills CLI:

```bash
npx skills add duyet/clickhouse-monitoring
```

### Manual Installation

Clone the repository and copy the skill directory:

```bash
git clone https://github.com/duyet/clickhouse-monitor.git
cp -r clickhouse-monitor/skills ~/.agents/skills/clickhouse-monitor
```

### Local Development

For local development or testing:

```bash
# Mount the repository as a plugin
cc --plugin-dir /path/to/clickhouse-monitor

# Or copy to your skills directory
cp -r skills ~/.agents/skills/clickhouse-monitor
```

Restart your AI agent to load the skill after installation.

## Usage

Once installed, AI agents can use this skill when working with:

- ClickHouse monitoring dashboards
- Query performance analysis
- Database schema exploration
- ClickHouse system table queries
- Dashboard feature development
- API integration with ClickHouse Monitor

### Example Agent Prompts

- "How do I monitor running ClickHouse queries?"
- "What API endpoints are available for chart data?"
- "Help me add a new chart to the dashboard"
- "Write a version-aware query for ClickHouse 24.3"
- "Explain the static site architecture"

## Features

### Dashboard Coverage

| Category | Pages |
|----------|-------|
| **Queries** | Running, History, Failed, Expensive, Cache, Thread Analysis, Parallelization |
| **Tables** | Explorer, Overview, Replicas, Replication Queue, Projections, Dictionaries |
| **Merges** | Active Merges, Performance, Mutations, New Parts |
| **Monitoring** | Metrics, Async Metrics, Custom Dashboard, Profiler |
| **Security** | Sessions, Login Attempts, Audit Log |
| **Logs** | Text Log, Stack Traces, Crashes |
| **Cluster** | Clusters, ZooKeeper, Connections |
| **System** | Settings, MergeTree Settings, Disks |

### API Documentation

Complete reference for all `/api/v1/*` endpoints:

- `/api/v1/charts/[name]` - Chart data with SWR caching
- `/api/v1/tables/[name]` - Table data with pagination
- `/api/v1/explorer/*` - Database explorer endpoints
- `/api/v1/hosts` - Multi-host configuration

### Development Guide

Patterns and conventions for contributing:

- Static site architecture (client-side only)
- SWR data fetching patterns
- Adding routes, charts, and query configs
- Multi-host configuration
- Git commit conventions

## Documentation

| Document | Description |
|----------|-------------|
| [SKILL.md](SKILL.md) | Main skill file - quick reference and core patterns |
| [Complete API List](references/api-list.md) | All 58 charts and 63 table endpoints (auto-generated) |
| [Dashboard Pages](references/dashboard-pages.md) | All 45 dashboard pages (auto-generated) |
| [API Reference](references/api-endpoints.md) | Complete API documentation with examples |
| [Development Guide](references/development.md) | Architecture, patterns, contribution workflow |
| [ClickHouse Compatibility](references/clickhouse-compat.md) | Version-aware queries and schema handling |

### Keeping Documentation Updated

The API list and dashboard pages are automatically generated from the codebase:

```bash
bun run scripts/generate-skill-docs.ts
```

This scans `lib/api/charts/` and `lib/query-config/` to extract all available endpoints.

## Agent Skills Format

This skill follows the [Agent Skills](https://agentskills.io) open standard originally developed by Anthropic. Skills in this format can be used across multiple agent products that support the standard.

**Skill Structure:**
```
skills/
├── SKILL.md                 # Main skill file (YAML frontmatter + content)
├── README.md               # This file - installation and overview
├── LICENSE                 # MIT License
└── references/             # Progressive disclosure docs
    ├── api-list.md         # Auto-generated API endpoints list
    ├── dashboard-pages.md  # Auto-generated dashboard pages
    ├── api-endpoints.md    # Complete API documentation with examples
    ├── development.md      # Architecture, patterns, contribution workflow
    └── clickhouse-compat.md # Version-aware queries and schema handling
```

## License

MIT

## Links

- [ClickHouse Monitor Repository](https://github.com/duyet/clickhouse-monitor)
- [Agent Skills Documentation](https://agentskills.io)
- [ClickHouse Documentation](https://clickhouse.com/docs)
