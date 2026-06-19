// Maps doc page subpaths to sidebar icon names (Lucide-style).

export type NavIconName =
  | 'activity'
  | 'arrow-right-left'
  | 'badge-check'
  | 'bar-chart-3'
  | 'book-open'
  | 'bot'
  | 'boxes'
  | 'cloud'
  | 'cloud-upload'
  | 'compass'
  | 'container'
  | 'cpu'
  | 'database'
  | 'eye'
  | 'file-text'
  | 'gift'
  | 'git-branch'
  | 'globe'
  | 'hard-drive'
  | 'heart-pulse'
  | 'help-circle'
  | 'history'
  | 'home'
  | 'key'
  | 'key-round'
  | 'laptop'
  | 'layout-dashboard'
  | 'layout-grid'
  | 'layout-list'
  | 'lightbulb'
  | 'lock'
  | 'message-square'
  | 'messages-square'
  | 'network'
  | 'plug'
  | 'radar'
  | 'rocket'
  | 'scroll-text'
  | 'search'
  | 'server'
  | 'server-cog'
  | 'settings'
  | 'settings-2'
  | 'shield'
  | 'shield-check'
  | 'sliders-horizontal'
  | 'sparkles'
  | 'table'
  | 'tag'
  | 'terminal'
  | 'unlock'
  | 'user-check'
  | 'user-cog'
  | 'variable'
  | 'wrench'

/** Strip optional /vX.Y version prefix from a nav link. */
export function linkToSubpath(link: string): string {
  if (link === '/') return ''
  const stripped = link.replace(/^\/v\d+(?:\.\d+)*/, '')
  if (!stripped || stripped === '/') return ''
  return stripped.startsWith('/') ? stripped.slice(1) : stripped
}

const PAGE_ICONS: Record<string, NavIconName> = {
  '': 'home',
  'getting-started': 'rocket',
  'getting-started/clickhouse-requirements': 'user-cog',
  'getting-started/clickhouse-enable-system-tables': 'database',
  'getting-started/local': 'laptop',
  deploy: 'cloud-upload',
  'deploy/cloudflare': 'cloud',
  'deploy/docker': 'container',
  'deploy/k8s': 'boxes',
  'deploy/production-checklist': 'layout-list',
  'deploy/self-host': 'server',
  'deploy/vercel': 'globe',
  features: 'layout-grid',
  'features/browser-connections': 'globe',
  'features/cluster': 'network',
  'features/dashboard': 'layout-dashboard',
  'features/explorer': 'search',
  'features/health': 'heart-pulse',
  'features/insights': 'lightbulb',
  'features/logs': 'scroll-text',
  'features/mcp': 'plug',
  'features/metrics': 'bar-chart-3',
  'features/operations': 'wrench',
  'features/overview': 'eye',
  'features/peerdb': 'git-branch',
  'features/queries': 'terminal',
  'features/security': 'shield',
  'features/settings': 'settings',
  'features/tables': 'table',
  'advanced/agent-conversation-storage': 'messages-square',
  'advanced/custom-name': 'tag',
  'advanced/feature-permissions': 'lock',
  'advanced/multiple-hosts': 'server-cog',
  'advanced/peerdb-monitoring': 'activity',
  'advanced/queries-history': 'history',
  'advanced/self-tracking': 'radar',
  'reference/configuration': 'sliders-horizontal',
  'reference/environment-variables': 'variable',
  'reference/mcp-server': 'cpu',
  'ai-agent': 'bot',
  'ai-agent/capabilities': 'sparkles',
  'ai-agent/configuration': 'settings-2',
  'ai-agent/conversation-history': 'message-square',
  'ai-agent/conversation-history/backends': 'hard-drive',
  authentication: 'key-round',
  'authentication/api-keys': 'key',
  'authentication/clerk': 'user-check',
  'authentication/public': 'unlock',
  'authentication/cloudflare-access': 'shield-check',
  'authentication/trusted-header': 'badge-check',
  'authentication/trusted-proxy': 'badge-check',
  'migrating/v0-3': 'arrow-right-left',
  'releases/v0-3': 'gift',
  faq: 'help-circle',
  settings: 'settings',
}

const SECTION_ICONS: Record<string, NavIconName> = {
  'getting-started': 'compass',
  deploy: 'cloud-upload',
  features: 'layout-grid',
  advanced: 'wrench',
  reference: 'book-open',
  'ai-agent': 'bot',
  authentication: 'shield',
  migrating: 'arrow-right-left',
  releases: 'gift',
}

export function resolveNavIcon(link: string): NavIconName {
  const subpath = linkToSubpath(link)
  if (PAGE_ICONS[subpath]) return PAGE_ICONS[subpath]
  const section = subpath.split('/')[0]
  if (section && SECTION_ICONS[section]) return SECTION_ICONS[section]
  return 'file-text'
}
