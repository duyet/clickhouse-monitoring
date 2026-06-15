import { linkToSubpath } from './nav-icons'

const PAGE_DESCRIPTIONS: Record<string, string> = {
  '': 'What ClickHouse Monitor is and how to use these docs',
  'getting-started': 'Install, connect, and run your first dashboard',
  'getting-started/clickhouse-requirements':
    'Users, grants, and permissions for monitoring',
  'getting-started/clickhouse-enable-system-tables':
    'Turn on system tables the dashboard reads',
  'getting-started/local': 'Run the dashboard locally with Bun or Docker',
  deploy: 'Choose where and how to run ClickHouse Monitor',
  'deploy/cloudflare': 'Deploy to Cloudflare Workers at the edge',
  'deploy/docker': 'Run with Docker Compose or a container image',
  'deploy/k8s': 'Helm chart and Kubernetes deployment patterns',
  'deploy/production-checklist': 'Hardening checklist before going live',
  'deploy/self-host': 'Node standalone or reverse-proxy hosting',
  'deploy/vercel': 'Legacy Vercel deployment notes',
  features: 'Dashboard pages, charts, and operational views',
  'features/browser-connections':
    'Connect from the browser without a backend proxy',
  'features/cluster': 'Cluster topology, replicas, and node health',
  'features/dashboard': 'Custom dashboards and saved layouts',
  'features/explorer': 'Browse databases, tables, and dependencies',
  'features/health': 'Cluster health signals and alerts',
  'features/insights': 'Automated insights from system tables',
  'features/logs': 'Query, error, and backup log views',
  'features/mcp': 'Expose monitoring tools over MCP',
  'features/metrics': 'Time-series metrics and resource usage',
  'features/operations': 'Merges, mutations, and background work',
  'features/overview': 'Connections, queries, merges at a glance',
  'features/peerdb': 'PeerDB replication monitoring',
  'features/queries': 'Running queries and query history',
  'features/security': 'Users, grants, and access policies',
  'features/settings': 'Dashboard settings and preferences',
  'features/tables': 'Table sizes, parts, and storage breakdown',
  'advanced/agent-conversation-storage': 'Persist AI agent threads and history',
  'advanced/custom-name': 'Friendly names for multiple ClickHouse hosts',
  'advanced/feature-permissions': 'Gate dashboard features by role',
  'advanced/multiple-hosts': 'Monitor several clusters from one install',
  'advanced/peerdb-monitoring': 'Deep PeerDB lag and pipeline metrics',
  'advanced/queries-history': 'Long-retention query_log analytics',
  'advanced/self-tracking': 'Let the dashboard track its own queries',
  'reference/configuration': 'Config files, defaults, and overrides',
  'reference/environment-variables': 'Every env var the app understands',
  'reference/mcp-server': 'MCP server tools, auth, and setup',
  'ai-agent': 'AI assistant built into the dashboard',
  'ai-agent/capabilities': 'Tools, skills, and what the agent can do',
  'ai-agent/configuration': 'Models, prompts, and agent env vars',
  'ai-agent/conversation-history': 'Thread list, storage, and retention',
  'ai-agent/conversation-history/backends': 'D1, KV, and other history stores',
  authentication: 'Protect the dashboard and API routes',
  'authentication/api-keys': 'Machine-to-machine access with chm_ keys',
  'authentication/clerk': 'Sign-in with Clerk organizations',
  'authentication/public': 'Run without authentication (dev only)',
  'authentication/cloudflare-access': 'Gate access behind Cloudflare Access',
  'authentication/trusted-header': 'Trust an upstream reverse-proxy header',
  'migrating/v0-3': 'Upgrade from Next.js or older monitor versions',
  'releases/v0-3': 'TanStack Start, Workers, and v0.3 highlights',
  faq: 'Common setup and troubleshooting answers',
  settings: 'Global settings reference for operators',
}

const SECTION_DESCRIPTIONS: Record<string, string> = {
  Introduction: 'Product overview and housekeeping pages',
  'Getting Started': 'First-time setup and local development',
  Deployment: 'Production deployment guides',
  Features: 'Dashboard capabilities and UI tours',
  Advanced: 'Power-user configuration and multi-host setups',
  Reference: 'Configuration reference and API surfaces',
  'AI Agent': 'In-dashboard AI assistant',
  Authentication: 'Auth modes and access control',
  Migrating: 'Version upgrade paths',
  Releases: 'Release notes and changelogs',
  More: 'FAQ and settings',
}

/** Merged header category blurbs (6 top-level tabs). */
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  Introduction: 'Overview, FAQ, and settings',
  'Getting Started': 'Install, connect, and develop locally',
  Deploy: 'Hosting, auth, and production rollout',
  Features: 'Dashboard pages and operational views',
  'AI Agent': 'In-dashboard assistant and configuration',
  Reference: 'Config, env vars, advanced topics, and releases',
}

export function resolveNavDescription(link: string, label: string): string {
  const subpath = linkToSubpath(link)
  if (PAGE_DESCRIPTIONS[subpath]) return PAGE_DESCRIPTIONS[subpath]
  const section = subpath.split('/')[0]
  if (section && SECTION_DESCRIPTIONS[section])
    return SECTION_DESCRIPTIONS[section]
  return `Documentation for ${label}`
}

export function resolveSectionDescription(label: string): string {
  return SECTION_DESCRIPTIONS[label] ?? `Pages in ${label}`
}

export function resolveCategoryDescription(label: string): string {
  return CATEGORY_DESCRIPTIONS[label] ?? resolveSectionDescription(label)
}
