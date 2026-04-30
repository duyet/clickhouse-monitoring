import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { rewriteDocsHref, slugify } from '@/app/docs/_lib/shared'

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
    title: 'ClickHouse Monitoring',
    items: [{ title: 'Introduction', slug: '' }],
  },
  {
    title: 'Getting Started',
    items: [
      { title: 'Getting Started', slug: 'getting-started' },
      { title: 'Local Development', slug: 'getting-started/local' },
      {
        title: 'User Roles and Profile',
        slug: 'getting-started/clickhouse-requirements',
      },
      {
        title: 'Enable System Tables',
        slug: 'getting-started/clickhouse-enable-system-tables',
      },
    ],
  },
  {
    title: 'Deployments',
    items: [
      { title: 'Deploy', slug: 'deploy' },
      { title: 'Vercel', slug: 'deploy/vercel' },
      { title: 'Cloudflare Pages', slug: 'deploy/cloudflare' },
      { title: 'Docker', slug: 'deploy/docker' },
      { title: 'Kubernetes', slug: 'deploy/k8s' },
    ],
  },
  {
    title: 'Advanced',
    items: [
      { title: 'Multiple Hosts', slug: 'advanced/multiple-hosts' },
      { title: 'Custom Host Name', slug: 'advanced/custom-name' },
      { title: 'Queries History', slug: 'advanced/queries-history' },
      { title: 'Self-Tracking', slug: 'advanced/self-tracking' },
    ],
  },
]

const docsContentDir = path.join(process.cwd(), 'docs', 'content')

export function getDocsSlugs() {
  return docsNav.flatMap((section) => section.items.map((item) => item.slug))
}

export function getDocsPath(slug: string) {
  if (!slug) {
    return path.join(docsContentDir, 'index.mdx')
  }

  return path.join(docsContentDir, `${slug}.mdx`)
}

export function getDocsPage(slug: string): DocsPage | null {
  const normalizedSlug = normalizeSlug(slug)
  const filePath = getDocsPath(normalizedSlug)

  if (!existsSync(filePath)) {
    return null
  }

  const source = readFileSync(filePath, 'utf8')
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

export function normalizeSlug(slug: string) {
  return slug
    .split('/')
    .filter(Boolean)
    .filter((part) => part !== '..' && part !== '.')
    .join('/')
}

export function docsHref(slug: string) {
  return slug ? `/docs/${slug}` : '/docs'
}

function normalizeMdx(source: string) {
  return source
    .replace(/^import .+$/gm, '')
    .replace(/<Cards>[\s\S]*?<\/Cards>/g, cardsToMarkdown)
    .replace(/<Tabs items=\{\[([\s\S]*?)\]\}>[\s\S]*?<\/Tabs>/g, tabsToMarkdown)
    .replace(/<\/?Steps>/g, '')
    .replace(/<\/?Tabs\.Tab>/g, '')
    .replace(/```(\w+)\s+([^`\n]+?)\s+```/g, '```$1\n$2\n```')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
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
  const labels = [...labelsSource.matchAll(/'([^']+)'/g)].map(
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
  return [...markdown.matchAll(/^(#{2,3})\s+(.+)$/gm)].map((match) => {
    const text = match[2].replace(/\s+#$/, '')

    return {
      id: slugify(text),
      text,
      level: match[1].length,
    }
  })
}
