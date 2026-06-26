// Transform the working docs (docs/content/**) into Fumadocs content
// (apps/docs/content/docs/**). Runs as a prebuild step.
//
// docs/content/** is the single committed source of truth; everything written
// under content/docs/** is a generated artifact (gitignored). There is no
// per-release versioning: the working docs are served at the site root.
//
// Key differences from the old Starlight sync-docs.mjs:
//  - Output goes to content/docs/ (not src/content/docs/)
//  - Frontmatter uses only `title` and optional `description`; no Starlight-
//    specific `sidebar:`, `editUrl:`, or `order:` fields.
//  - The h1 heading is KEPT in the body as a comment-strip (Fumadocs renders
//    the DocsTitle from frontmatter.title separately, so the body h1 would
//    duplicate it — we strip it). Remaining `# ` headings are left as-is
//    (Fumadocs doesn't demote them automatically).
//  - /docs/X links are NOT rewritten — the docs site serves at the root so
//    the existing /docs/X hrefs resolve correctly.
//  - Local image paths are rewritten to raw.githubusercontent.com URLs (same
//    as before, because the built Worker has no access to the repo filesystem).
//  - meta.json files are generated at root and per-section to control the
//    Fumadocs sidebar order and display names.

import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, posix, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '../../..')
const SRC_DIR = resolve(REPO_ROOT, 'docs/content')
const DEST_DIR = resolve(__dirname, '../content/docs')
const RAW_BASE = 'https://raw.githubusercontent.com/duyet/clickhouse-monitoring/main'

// Top-level sidebar order.
// Groups: orientation → deployment → features → auth → AI → separator → advanced →
// guides → reference → separator → meta → separator → utility.
const ROOT_ORDER = [
  'index',
  'getting-started',
  'deploy',
  'features',
  'authentication',
  'ai-agent',
  '---',
  'advanced',
  'guides',
  'reference',
  '---',
  'migrating',
  'releases',
  '---',
  'faq',
  'settings',
]

// Display titles for section folders (Fumadocs would auto-format, but we want
// exact control — e.g. "AI Agent" not "Ai Agent").
const SECTION_TITLES = {
  'getting-started': 'Getting Started',
  guides: 'Guides',
  deploy: 'Deployment',
  features: 'Features',
  'ai-agent': 'AI Agent',
  authentication: 'Authentication',
  advanced: 'Advanced',
  reference: 'Reference',
  migrating: 'Migrating',
  releases: 'Releases',
}

// Explicit page ordering within each section.
// Entries are slug names relative to the section folder (no extension).
// "index" refers to the section landing page (from a root-level .mdx with the
// same name as the folder). Sections without a landing page omit "index".
const SECTION_PAGE_ORDER = {
  'getting-started': [
    'index',
    'clickhouse-requirements',
    'clickhouse-enable-system-tables',
    'local',
  ],
  guides: ['proxy-auth-setup', 'troubleshooting', 'upgrade-clickhouse'],
  deploy: [
    'index',
    'docker',
    'k8s',
    'cloudflare',
    'vercel',
    'self-host',
    'traefik',
    'one-click',
    'production-checklist',
  ],
  features: [
    'index',
    'overview',
    'queries',
    'tables',
    'explorer',
    'operations',
    'cluster',
    'metrics',
    'insights',
    'health',
    'security',
    'logs',
    'dashboard',
    'mcp',
    'peerdb',
    'browser-connections',
    'user-connections',
    'settings',
  ],
  'ai-agent': ['index', 'capabilities', 'configuration', 'conversation-history'],
  authentication: [
    'index',
    'public',
    'api-keys',
    'clerk',
    'cloudflare-access',
    'trusted-header',
    'trusted-proxy',
  ],
  advanced: [
    'feature-permissions',
    'multiple-hosts',
    'editions',
    'queries-history',
    'self-tracking',
    'telemetry',
    'agent-conversation-storage',
    'custom-name',
    'peerdb-monitoring',
  ],
  reference: [
    'environment-variables',
    'configuration',
    'mcp-server',
    'mcp-clients',
    'support-matrix',
    'grafana-bridge',
    'connection-presets',
    'catalog-contributing',
  ],
  migrating: ['v0-3'],
  releases: ['v0-3'],
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(full)))
    else if (/\.mdx?$/.test(entry.name)) files.push(full)
  }
  return files
}

// Split off a leading `--- ... ---` YAML block. Returns { data, body }.
function parseFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!m) return { data: {}, body: src }
  const data = {}
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/)
    if (!kv) continue
    let value = kv[2].trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    data[kv[1]] = value
  }
  return { data, body: src.slice(m[0].length) }
}

function stripImports(src) {
  return src.replace(
    /^import\s+.*\s+from\s+['"](?:nextra\/components|lucide-react)['"]\s*\n/gm,
    '',
  )
}

// Remove the first top-level `# Heading` (it becomes frontmatter.title).
// Unlike the Starlight sync, we do NOT demote remaining `# ` headings
// (Fumadocs allows multiple h1 levels in body content).
function extractTitle(src, fallback) {
  const lines = src.split('\n')
  let title = fallback
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#\s+(.+)$/)
    if (m) {
      title = m[1].trim()
      lines.splice(i, 1)
      // Remove a blank line immediately after the heading
      if (lines[i] !== undefined && lines[i].trim() === '') lines.splice(i, 1)
      break
    }
  }
  return { title, body: lines.join('\n') }
}

// Rewrite local image references to raw.githubusercontent.com URLs.
function rewriteImages(src, srcFileAbs) {
  const fileDirRel = posix.dirname(relative(REPO_ROOT, srcFileAbs))
  return src.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
    if (/^https?:\/\//.test(url)) return match
    let repoPath
    if (url.startsWith('/')) repoPath = `apps/dashboard/public${url}`
    else repoPath = posix.normalize(posix.join(fileDirRel, url))
    return `![${alt}](${RAW_BASE}/${repoPath})`
  })
}

function humanize(slug) {
  return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

async function main() {
  if (!existsSync(SRC_DIR)) {
    throw new Error(`Source docs not found at ${SRC_DIR}`)
  }

  // Determine which top-level names also have a sibling directory (section landings).
  const topEntries = await readdir(SRC_DIR, { withFileTypes: true })
  const sectionDirs = new Set(
    topEntries.filter((e) => e.isDirectory()).map((e) => e.name),
  )

  await rm(DEST_DIR, { recursive: true, force: true })
  await mkdir(DEST_DIR, { recursive: true })

  const files = await walk(SRC_DIR)
  let total = 0
  for (const fileAbs of files) {
    const rel = relative(SRC_DIR, fileAbs).split(sep).join('/')
    const noExt = rel.replace(/\.mdx?$/, '')
    const isSectionLanding = !noExt.includes('/') && sectionDirs.has(noExt)

    let content = await readFile(fileAbs, 'utf8')
    const { data: fm, body: afterFm } = parseFrontmatter(content)
    content = stripImports(afterFm)
    content = rewriteImages(content, fileAbs)
    // NOTE: /docs/X links are preserved — the docs site serves at root and
    // the /docs/ prefix in hrefs resolves correctly in-browser.

    const fallback = humanize(noExt.split('/').pop())
    const { title: h1Title, body } = extractTitle(content, fallback)
    const title = fm.title || h1Title

    // Fumadocs frontmatter: only title and optional description.
    let frontmatter = `---\ntitle: ${JSON.stringify(title)}\n`
    if (fm.description) frontmatter += `description: ${JSON.stringify(fm.description)}\n`
    frontmatter += `---\n\n`

    // Section landings: write as <section>/index.md so Fumadocs creates a
    // linked section root that appears as "Overview" first in its group.
    const destRel = isSectionLanding ? `${noExt}/index.md` : `${noExt}.md`
    const dest = join(DEST_DIR, destRel)

    await mkdir(dirname(dest), { recursive: true })
    await writeFile(dest, `${frontmatter}${body.trim()}\n`, 'utf8')
    total++
  }

  // Root meta.json — controls top-level sidebar order.
  await writeFile(
    join(DEST_DIR, 'meta.json'),
    JSON.stringify({ pages: ROOT_ORDER }, null, 2) + '\n',
    'utf8',
  )

  // Per-section meta.json — sets display name and explicit page ordering.
  for (const [slug, title] of Object.entries(SECTION_TITLES)) {
    const sectionDir = join(DEST_DIR, slug)
    if (existsSync(sectionDir)) {
      const pages = SECTION_PAGE_ORDER[slug]
      const meta = pages ? { title, pages } : { title }
      await writeFile(
        join(sectionDir, 'meta.json'),
        JSON.stringify(meta, null, 2) + '\n',
        'utf8',
      )
    }
  }

  console.log(
    `[sync-docs] ${total} page(s) → content/docs (Fumadocs, served at /)`,
  )
}

await main()
