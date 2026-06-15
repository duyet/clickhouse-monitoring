import { docsContent } from './content'
import { rewriteDocsHref, slugify } from './shared'

export type DocsNavItem = {
  title: string
  slug: string
}

export type DocsNavSection = {
  title: string
  items: DocsNavItem[]
}

export type DocsHeading = {
  id: string
  text: string
  level: number
}

export type DocsPage = {
  slug: string
  title: string
  markdown: string
  headings: DocsHeading[]
}

export const docsNav: DocsNavSection[] = [
  {
    title: 'chmonitor',
    items: [
      { title: 'Introduction', slug: '' },
      { title: 'Features', slug: 'features' },
      { title: 'FAQ', slug: 'faq' },
    ],
  },
  {
    title: 'Getting Started',
    items: [
      { title: 'Getting Started', slug: 'getting-started' },
      { title: 'Local Development', slug: 'getting-started/local' },
      {
        title: 'ClickHouse User & Grants',
        slug: 'getting-started/clickhouse-requirements',
      },
      {
        title: 'Enable System Tables',
        slug: 'getting-started/clickhouse-enable-system-tables',
      },
    ],
  },
  {
    // Each platform page is self-contained: install + every config category +
    // auth + migration notes for that platform.
    title: 'Install & Configure',
    items: [
      { title: 'Choosing a Platform', slug: 'deploy' },
      { title: 'Docker', slug: 'deploy/docker' },
      { title: 'Kubernetes', slug: 'deploy/k8s' },
      { title: 'Cloudflare Workers', slug: 'deploy/cloudflare' },
      { title: 'Vercel', slug: 'deploy/vercel' },
      { title: 'Self-Host (Node)', slug: 'deploy/self-host' },
      { title: 'Production Checklist', slug: 'deploy/production-checklist' },
    ],
  },
  {
    // One page per supported auth method, plus an overview.
    title: 'Authentication',
    items: [
      { title: 'Overview', slug: 'authentication' },
      { title: 'Public (no auth)', slug: 'authentication/public' },
      { title: 'API Keys', slug: 'authentication/api-keys' },
      { title: 'Clerk', slug: 'authentication/clerk' },
      {
        title: 'Cloudflare Access',
        slug: 'authentication/cloudflare-access',
      },
      {
        title: 'Trusted Header Proxy',
        slug: 'authentication/trusted-header',
      },
    ],
  },
  {
    // One templated page per feature group: what it does, permission, system
    // tables, grants.
    title: 'Feature Guides',
    items: [
      { title: 'Overview', slug: 'features/overview' },
      { title: 'Query Monitoring', slug: 'features/queries' },
      { title: 'Tables & Storage', slug: 'features/tables' },
      { title: 'Data Explorer', slug: 'features/explorer' },
      { title: 'Merges & Operations', slug: 'features/operations' },
      { title: 'Clusters & Replication', slug: 'features/cluster' },
      { title: 'Metrics & Profiler', slug: 'features/metrics' },
      { title: 'Insights', slug: 'features/insights' },
      { title: 'Health & Alerting', slug: 'features/health' },
      { title: 'Security & Audit', slug: 'features/security' },
      { title: 'Logs', slug: 'features/logs' },
      { title: 'Settings', slug: 'features/settings' },
      { title: 'Dashboard', slug: 'features/dashboard' },
      { title: 'MCP Server', slug: 'features/mcp' },
      { title: 'PeerDB', slug: 'features/peerdb' },
      {
        title: 'Browser Connections',
        slug: 'features/browser-connections',
      },
      {
        title: 'User Connections',
        slug: 'features/user-connections',
      },
    ],
  },
  {
    title: 'AI Agent',
    items: [
      { title: 'Overview', slug: 'ai-agent' },
      { title: 'Configuration', slug: 'ai-agent/configuration' },
      { title: 'Capabilities', slug: 'ai-agent/capabilities' },
      {
        title: 'Conversation History',
        slug: 'ai-agent/conversation-history',
      },
      {
        title: 'Conversation Backends',
        slug: 'ai-agent/conversation-history/backends',
      },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { title: 'Configuration Overview', slug: 'reference/configuration' },
      {
        title: 'Environment Variables',
        slug: 'reference/environment-variables',
      },
      { title: 'Feature Permissions', slug: 'advanced/feature-permissions' },
      { title: 'Multiple Hosts', slug: 'advanced/multiple-hosts' },
      { title: 'Custom Host Name', slug: 'advanced/custom-name' },
      { title: 'Queries History', slug: 'advanced/queries-history' },
      { title: 'Self-Tracking', slug: 'advanced/self-tracking' },
      { title: 'PeerDB Setup', slug: 'advanced/peerdb-monitoring' },
      { title: 'Settings (in-app)', slug: 'settings' },
    ],
  },
  {
    title: 'Reference',
    items: [{ title: 'MCP Server', slug: 'reference/mcp-server' }],
  },
  {
    // One "Migrate to vX.Y" page per breaking release, newest first.
    title: 'Migrating',
    items: [{ title: 'Migrate to v0.3', slug: 'migrating/v0-3' }],
  },
  {
    // One "What's New in vX.Y" page per release, newest first.
    title: 'Releases',
    items: [{ title: "What's New in v0.3", slug: 'releases/v0-3' }],
  },
]

export function docsHref(slug: string) {
  return slug ? `/docs/${slug}` : '/docs'
}

export function getDocsPage(slug: string): DocsPage | null {
  const normalizedSlug = normalizeSlug(slug)
  const source = docsContent[normalizedSlug] ?? null

  if (source === null) {
    return null
  }

  const markdown = normalizeMdx(source)
  const title = extractTitle(markdown, normalizedSlug)
  const headings = extractHeadings(markdown)

  return {
    slug: normalizedSlug,
    title,
    markdown,
    headings,
  }
}

function normalizeSlug(slug: string) {
  return slug
    .split('/')
    .filter(Boolean)
    .filter((part) => part !== '..' && part !== '.')
    .join('/')
}

/**
 * Converts the Nextra-flavored MDX source into markdown that DocsMarkdown can render.
 *
 * Fenced code blocks are protected before component/import cleanup so examples are
 * not modified by the regex transforms.
 */
function normalizeMdx(source: string) {
  const normalizedCodeFences = source.replace(
    /```(\w+)\s+([^`\n]+?)\s+```/g,
    '```$1\n$2\n```'
  )
  const protectedSource = protectFencedCodeBlocks(normalizedCodeFences)

  return demoteNestedTitles(
    protectedSource.markdown
      .replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '')
      .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
      .replace(/<Cards>[\s\S]*?<\/Cards>/g, cardsToMarkdown)
      .replace(
        /<Tabs items=\{\[([\s\S]*?)\]\}>[\s\S]*?<\/Tabs>/g,
        tabsToMarkdown
      )
      .replace(/<\/?Steps>/g, '')
      .replace(/<\/?Tabs\.Tab>/g, '')
      .replace(/\n{3,}/g, '\n\n')
  )
    .trim()
    .replace(
      /<!-- DOCS_CODE_BLOCK_(\d+) -->/g,
      (_match, index) => protectedSource.codeBlocks[Number(index)] ?? ''
    )
}

/**
 * Replaces fenced code blocks with stable placeholders during MDX cleanup.
 */
function protectFencedCodeBlocks(markdown: string) {
  const codeBlocks: string[] = []

  return {
    markdown: markdown.replace(/```[\s\S]*?```/g, (match) => {
      const index = codeBlocks.push(match) - 1
      return `<!-- DOCS_CODE_BLOCK_${index} -->`
    }),
    codeBlocks,
  }
}

function demoteNestedTitles(markdown: string) {
  let seenTitle = false

  return markdown.replace(/^#\s+(.+)$/gm, (match) => {
    if (!seenTitle) {
      seenTitle = true
      return match
    }
    return `#${match}`
  })
}

function cardsToMarkdown(block: string) {
  const cards = block
    .split('<Cards.Card')
    .slice(1)
    .map((match) => {
      const title = match.match(/title="([^"]+)"/)?.[1]
      const href = match.match(/href="([^"]+)"/)?.[1]

      if (!title || !href) {
        return null
      }

      return `- [${title}](${rewriteDocsHref(href)})`
    })
    .filter(Boolean)

  return cards.length > 0 ? `\n\n${cards.join('\n')}\n\n` : ''
}

function tabsToMarkdown(block: string, labelsSource: string) {
  const labels = [...labelsSource.matchAll(/["']([^"']+)["']/g)].map(
    (match) => match[1]
  )
  const tabs = [...block.matchAll(/<Tabs\.Tab>([\s\S]*?)<\/Tabs\.Tab>/g)].map(
    (match) => match[1].trim()
  )

  return tabs
    .map((tab, index) => {
      const label = labels[index] ?? `Option ${index + 1}`
      return `\n\n#### ${label}\n\n${tab}\n`
    })
    .join('')
}

function extractTitle(markdown: string, slug: string) {
  return (
    markdown.match(/^#\s+(.+)$/m)?.[1] ??
    docsNav
      .flatMap((section) => section.items)
      .find((item) => item.slug === slug)?.title ??
    'Docs'
  )
}

function extractHeadings(markdown: string): DocsHeading[] {
  const seenIds = new Map<string, number>()

  return [...markdown.matchAll(/^(#{2,3})\s+(.+)$/gm)].map((match) => {
    const text = match[2].replace(/\s+#$/, '')
    const baseId = slugify(text)
    const count = seenIds.get(baseId) ?? 0
    seenIds.set(baseId, count + 1)

    return {
      id: count === 0 ? baseId : `${baseId}-${count}`,
      text,
      level: match[1].length,
    }
  })
}
