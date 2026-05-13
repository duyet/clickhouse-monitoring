import { docsContent } from './content.generated'
import { rewriteDocsHref, slugify } from './shared'
import { cache } from 'react'

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

/**
 * Loads a docs page from docs/content by route slug.
 *
 * Returns null only when the source MDX file is missing.
 */
export const getDocsPage = cache(
  async (slug: string): Promise<DocsPage | null> => {
    const normalizedSlug = normalizeSlug(slug)
    const source = await readDocsSource(normalizedSlug)

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
)

function normalizeSlug(slug: string) {
  return slug
    .split('/')
    .filter(Boolean)
    .filter((part) => part !== '..' && part !== '.')
    .join('/')
}

export function docsHref(slug: string) {
  return slug ? `/docs/${slug}` : '/docs'
}

async function readDocsSource(slug: string) {
  const overrideRoot = process.env.DOCS_CONTENT_ROOT
  if (overrideRoot) {
    const { readFile } = await import('node:fs/promises')
    const { existsSync } = await import('node:fs')
    const { join } = await import('node:path')
    for (const ext of ['.mdx', '.md']) {
      const file = join(overrideRoot, slug ? `${slug}${ext}` : `index${ext}`)
      if (existsSync(file)) return readFile(file, 'utf8')
    }
    return null
  }
  return Object.hasOwn(docsContent, slug) ? docsContent[slug] : null
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
 *
 * This keeps imports, headings, Cards, and Tabs examples inside code fences intact.
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
