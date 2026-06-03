// Sync the dashboard docs (docs/content/**) into the Starlight content
// collection (src/content/docs/**), adapting Nextra MDX to Starlight MDX.
//
// Runs as a prebuild step (see package.json: `node scripts/sync-docs.mjs &&
// astro build`). The synced files are generated artifacts and are gitignored —
// docs/content is the single source of truth.
//
// Conversions:
//   - strip `nextra/components` and `lucide-react` imports
//   - first `# Heading`         -> frontmatter `title`, remaining `# ` -> `## `
//   - <Cards><Cards.Card .../>  -> <CardGrid><LinkCard title href />
//   - <Tabs items={[a,b]}>      -> <Tabs><TabItem label="a">… (content dedented)
//   - <Steps>### Step           -> <Steps><ol><li>**Step**…
//   - local image paths         -> raw.githubusercontent.com URLs
//   - inject the matching `@astrojs/starlight/components` import

import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, posix, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '../../..')
const SRC_DIR = resolve(REPO_ROOT, 'docs/content')
const DEST_DIR = resolve(__dirname, '../src/content/docs')
const RAW_BASE =
  'https://raw.githubusercontent.com/duyet/clickhouse-monitoring/main'
const EDIT_BASE =
  'https://github.com/duyet/clickhouse-monitoring/edit/main'

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(full)))
    } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
      files.push(full)
    }
  }
  return files
}

function stripImports(src) {
  return src.replace(
    /^import\s+.*\s+from\s+['"](?:nextra\/components|lucide-react)['"]\s*\n/gm,
    ''
  )
}

function dedent(text) {
  const lines = text.replace(/^\n+/, '').replace(/\s+$/, '').split('\n')
  const indents = lines
    .filter((l) => l.trim().length > 0)
    .map((l) => l.match(/^ */)[0].length)
  const min = indents.length ? Math.min(...indents) : 0
  return lines.map((l) => l.slice(min)).join('\n')
}

function convertCards(src) {
  let out = src.replace(/<Cards>/g, '<CardGrid>').replace(/<\/Cards>/g, '</CardGrid>')
  // Drop the `icon={<Foo />}` prop first — its inner `/>` would otherwise
  // terminate the non-greedy <Cards.Card ... /> match early.
  out = out.replace(/\s*icon=\{<[^}]*>\}/g, '')
  out = out.replace(/<Cards\.Card\b[\s\S]*?\/>/g, (card) => {
    const title = card.match(/title="([^"]*)"/)?.[1] ?? ''
    const href = card.match(/href="([^"]*)"/)?.[1] ?? ''
    return `<LinkCard title="${title}" href="${href}" />`
  })
  return out
}

function convertTabs(src) {
  return src.replace(
    /<Tabs\s+items=\{(\[[\s\S]*?\])\}>([\s\S]*?)<\/Tabs>/g,
    (_match, arr, inner) => {
      const labels = JSON.parse(arr.replace(/'/g, '"'))
      const tabRe = /<Tabs\.Tab>([\s\S]*?)<\/Tabs\.Tab>/g
      let body = ''
      let i = 0
      let m
      while ((m = tabRe.exec(inner)) !== null) {
        const label = labels[i] ?? `Tab ${i + 1}`
        body += `\n<TabItem label=${JSON.stringify(label)}>\n\n${dedent(m[1])}\n\n</TabItem>\n`
        i++
      }
      return `<Tabs>${body}</Tabs>`
    }
  )
}

function convertSteps(src) {
  return src.replace(/<Steps>([\s\S]*?)<\/Steps>/g, (_match, inner) => {
    const parts = inner.split(/^###\s+(.+)$/m)
    let out = '<Steps>\n\n<ol>\n'
    for (let i = 1; i < parts.length; i += 2) {
      const title = parts[i].trim()
      const content = (parts[i + 1] ?? '').replace(/^\n+/, '').replace(/\s+$/, '')
      out += `\n<li>\n\n**${title}**\n\n${content}\n\n</li>\n`
    }
    out += '\n</ol>\n\n</Steps>'
    return out
  })
}

function rewriteImages(src, srcFileAbs) {
  const fileDirRel = posix.dirname(relative(REPO_ROOT, srcFileAbs))
  return src.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
    if (/^https?:\/\//.test(url)) return match
    let repoPath
    if (url.startsWith('/')) {
      repoPath = `apps/dashboard/public${url}`
    } else {
      repoPath = posix.normalize(posix.join(fileDirRel, url))
    }
    return `![${alt}](${RAW_BASE}/${repoPath})`
  })
}

function extractTitle(src, fallback) {
  const lines = src.split('\n')
  let title = fallback
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#\s+(.+)$/)
    if (m) {
      title = m[1].trim()
      lines.splice(i, 1)
      if (lines[i] !== undefined && lines[i].trim() === '') lines.splice(i, 1)
      break
    }
  }
  // Demote any remaining top-level headings (only the title is the page h1).
  const body = lines.join('\n').replace(/^#\s+(.+)$/gm, '## $1')
  return { title, body }
}

function starlightImport(body) {
  const wanted = [
    ['CardGrid', /<CardGrid[\s>]/],
    ['Card', /<Card[\s>]/],
    ['LinkCard', /<LinkCard[\s>]/],
    ['Tabs', /<Tabs[\s>]/],
    ['TabItem', /<TabItem[\s>]/],
    ['Steps', /<Steps[\s>]/],
  ]
  const used = wanted.filter(([, re]) => re.test(body)).map(([name]) => name)
  if (used.length === 0) return ''
  return `import { ${used.join(', ')} } from '@astrojs/starlight/components'\n`
}

async function convertFile(srcFileAbs) {
  let content = await readFile(srcFileAbs, 'utf8')
  const fallback = srcFileAbs
    .split('/')
    .pop()
    .replace(/\.mdx?$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  content = stripImports(content)
  content = convertCards(content)
  content = convertTabs(content)
  content = convertSteps(content)
  content = rewriteImages(content, srcFileAbs)
  const { title, body } = extractTitle(content, fallback)

  // Point the "Edit page" link at the real source file under docs/content/**
  // (the synced src/content/docs copy is gitignored, so Starlight's default
  // path-based edit link would 404).
  const editUrl = `${EDIT_BASE}/${posix.normalize(relative(REPO_ROOT, srcFileAbs))}`

  const imports = starlightImport(body)
  const frontmatter = `---\ntitle: ${JSON.stringify(title)}\neditUrl: ${JSON.stringify(editUrl)}\n---\n\n`
  return `${frontmatter}${imports ? `${imports}\n` : ''}${body.trim()}\n`
}

async function main() {
  if (!existsSync(SRC_DIR)) {
    throw new Error(`Source docs not found at ${SRC_DIR}`)
  }

  // Reset the generated collection so removed source files don't linger.
  await rm(DEST_DIR, { recursive: true, force: true })
  await mkdir(DEST_DIR, { recursive: true })

  const files = await walk(SRC_DIR)
  let count = 0
  for (const file of files) {
    const rel = relative(SRC_DIR, file).replace(/\.md$/, '.mdx')
    const dest = join(DEST_DIR, rel)
    await mkdir(dirname(dest), { recursive: true })
    await writeFile(dest, await convertFile(file), 'utf8')
    count++
  }
  console.log(`[sync-docs] wrote ${count} page(s) to src/content/docs`)
}

await main()
