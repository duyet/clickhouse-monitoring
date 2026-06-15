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

/** Sidebar groups — aligned with docs.chmonitor.dev nav.json. */
export const docsNav: DocsNavSection[] = [
  {
    title: 'Introduction',
    items: [{ title: 'Introduction', slug: '' }],
  },
  {
    title: 'Getting Started',
    items: [
      { title: 'Overview', slug: 'getting-started' },
      {
        title: 'ClickHouse User & Grants',
        slug: 'getting-started/clickhouse-requirements',
      },
      {
        title: 'Enable System Tables',
        slug: 'getting-started/clickhouse-enable-system-tables',
      },
      { title: 'Local Development', slug: 'getting-started/local' },
    ],
  },
  {
    title: 'Deployment',
    items: [
      { title: 'Overview', slug: 'deploy' },
      { title: 'Cloudflare Workers', slug: 'deploy/cloudflare' },
      { title: 'Docker', slug: 'deploy/docker' },
      { title: 'Kubernetes', slug: 'deploy/k8s' },
      { title: 'Production Checklist', slug: 'deploy/production-checklist' },
      { title: 'Self-host (Node / standalone)', slug: 'deploy/self-host' },
      { title: 'Vercel', slug: 'deploy/vercel' },
    ],
  },
  {
    title: 'Features',
    items: [
      { title: 'Overview', slug: 'features' },
      { title: 'Browser Connections', slug: 'features/browser-connections' },
      { title: 'Cluster', slug: 'features/cluster' },
      { title: 'Dashboard', slug: 'features/dashboard' },
      { title: 'Data Explorer', slug: 'features/explorer' },
      { title: 'Health', slug: 'features/health' },
      { title: 'Insights', slug: 'features/insights' },
      { title: 'Logs', slug: 'features/logs' },
      { title: 'MCP Server', slug: 'features/mcp' },
      { title: 'Metrics', slug: 'features/metrics' },
      { title: 'Operations', slug: 'features/operations' },
      { title: 'Overview', slug: 'features/overview' },
      { title: 'PeerDB', slug: 'features/peerdb' },
      { title: 'Queries', slug: 'features/queries' },
      { title: 'Security', slug: 'features/security' },
      { title: 'Settings', slug: 'features/settings' },
      { title: 'Tables', slug: 'features/tables' },
    ],
  },
  {
    title: 'Advanced',
    items: [
      {
        title: 'Agent Conversation Storage',
        slug: 'advanced/agent-conversation-storage',
      },
      { title: 'Custom Name', slug: 'advanced/custom-name' },
      { title: 'Feature Permissions', slug: 'advanced/feature-permissions' },
      { title: 'Multiple Hosts', slug: 'advanced/multiple-hosts' },
      { title: 'PeerDB Monitoring', slug: 'advanced/peerdb-monitoring' },
      { title: 'Query History', slug: 'advanced/queries-history' },
      { title: 'Self-Tracking', slug: 'advanced/self-tracking' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { title: 'Configuration', slug: 'reference/configuration' },
      {
        title: 'Environment Variables',
        slug: 'reference/environment-variables',
      },
      { title: 'MCP Server', slug: 'reference/mcp-server' },
    ],
  },
  {
    title: 'AI Agent',
    items: [
      { title: 'Overview', slug: 'ai-agent' },
      { title: 'Agent capabilities', slug: 'ai-agent/capabilities' },
      { title: 'Configure the AI Agent', slug: 'ai-agent/configuration' },
      { title: 'Conversation history', slug: 'ai-agent/conversation-history' },
      {
        title: 'Conversation store backends',
        slug: 'ai-agent/conversation-history/backends',
      },
    ],
  },
  {
    title: 'Authentication',
    items: [
      { title: 'Overview', slug: 'authentication' },
      { title: 'API keys (chm_ Bearer)', slug: 'authentication/api-keys' },
      { title: 'Clerk', slug: 'authentication/clerk' },
      { title: 'Public (no auth)', slug: 'authentication/public' },
      {
        title: 'Reverse proxy: Cloudflare Access',
        slug: 'authentication/cloudflare-access',
      },
      {
        title: 'Reverse proxy: trusted header',
        slug: 'authentication/trusted-header',
      },
    ],
  },
  {
    title: 'Migrating',
    items: [{ title: 'Migrate to v0.3', slug: 'migrating/v0-3' }],
  },
  {
    title: 'Releases',
    items: [{ title: "v0.3 — What's New", slug: 'releases/v0-3' }],
  },
  {
    title: 'More',
    items: [
      { title: 'FAQ', slug: 'faq' },
      { title: 'Settings', slug: 'settings' },
    ],
  },
]

export function findActiveDocsSection(slug: string): DocsNavSection | null {
  const normalizedSlug = normalizeSlug(slug)

  for (const section of docsNav) {
    if (section.items.some((item) => item.slug === normalizedSlug)) {
      return section
    }
  }

  return docsNav[0] ?? null
}

export function docsHref(slug: string) {
  return slug ? `/docs/${slug}` : '/docs'
}

export function resolveDocsBreadcrumb(slug: string, pageTitle: string) {
  const normalizedSlug = normalizeSlug(slug)
  const section = findActiveDocsSection(normalizedSlug)
  const item = section?.items.find((entry) => entry.slug === normalizedSlug)

  if (section && item) {
    return `${section.title} / ${item.title}`
  }

  return pageTitle
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
