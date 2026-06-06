// Sync the per-release docs snapshots (docs/versions/<version>/**) into the
// Astro content collection (apps/docs/src/content/docs/<version>/**), and emit
// the version manifest, per-version navigation, and Cloudflare redirects.
//
// Runs as a prebuild step (package.json: `node scripts/sync-docs.mjs && astro
// build`). Everything it writes under src/ and public/_redirects is a generated
// artifact and is gitignored. The COMMITTED source of truth is:
//   - docs/content/**            the current/working docs
//   - docs/versions/<v>/**       frozen per-release snapshots (see snapshot-version.mjs)
//
// Routing model: every version is served under /<version>/…. The newest version
// is "latest"; public/_redirects sends `/` and any bare (unversioned) path to
// the latest version, so old links like docs.chmonitor.dev/getting-started keep
// working. Internal `/docs/…` links in the markdown are rewritten to the owning
// version's prefix so navigation stays within a version.
//
// Conversions per file:
//   - strip `nextra/components` / `lucide-react` imports (legacy authoring)
//   - first `# Heading` -> frontmatter `title`; remaining `# ` demoted to `## `
//   - `/docs/X` links   -> `/<version>/X`
//   - local image paths -> raw.githubusercontent.com URLs

import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, posix, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '../../..')
const VERSIONS_DIR = resolve(REPO_ROOT, 'docs/versions')
const DEST_DIR = resolve(__dirname, '../src/content/docs')
const GEN_DIR = resolve(__dirname, '../src/generated')
const PUBLIC_DIR = resolve(__dirname, '../public')
const RAW_BASE = 'https://raw.githubusercontent.com/duyet/clickhouse-monitoring/main'
const EDIT_BASE = 'https://github.com/duyet/clickhouse-monitoring/edit/main'

const VERSION_RE = /^v\d+(\.\d+)*$/

// Curated order + display labels for the top-level sidebar sections. Sections
// not listed here fall through in alphabetical order after the curated ones.
const SECTION_ORDER = [
  'getting-started',
  'deploy',
  'features',
  'advanced',
  'reference',
  'ai-agent',
  'authentication',
  'migrating',
  'releases',
]

const LABEL_OVERRIDES = {
  'getting-started': 'Getting Started',
  deploy: 'Deployment',
  'ai-agent': 'AI Agent',
  k8s: 'Kubernetes',
  faq: 'FAQ',
  mcp: 'MCP',
  'mcp-server': 'MCP Server',
  peerdb: 'PeerDB',
  'peerdb-monitoring': 'PeerDB Monitoring',
  api: 'API',
  cloudflare: 'Cloudflare',
  'cloudflare-access': 'Cloudflare Access',
  ui: 'UI',
}

function humanize(slug) {
  if (LABEL_OVERRIDES[slug]) return LABEL_OVERRIDES[slug]
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bV(\d)/g, 'v$1')
}

// Highest version first. Compares dotted numeric parts; "v0.4" > "v0.3".
function compareVersionsDesc(a, b) {
  const pa = a.slice(1).split('.').map(Number)
  const pb = b.slice(1).split('.').map(Number)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const d = (pb[i] ?? 0) - (pa[i] ?? 0)
    if (d) return d
  }
  return 0
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

function stripImports(src) {
  return src.replace(
    /^import\s+.*\s+from\s+['"](?:nextra\/components|lucide-react)['"]\s*\n/gm,
    ''
  )
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
  // Only the frontmatter title is the page h1; demote any other top-level h1.
  const body = lines.join('\n').replace(/^#\s+(.+)$/gm, '## $1')
  return { title, body }
}

// Rewrite `/docs/X` links to the owning version prefix: `/<version>/X`.
// `/docs` (the docs root) maps to the version root `/<version>`.
function rewriteDocLinks(src, version) {
  return src.replace(/\]\((\/docs(?:\/[^)#]*)?)((?:#[^)]*)?)\)/g, (_m, path, hash) => {
    const rest = path.replace(/^\/docs/, '')
    return `](/${version}${rest}${hash})`
  })
}

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

function slugFromRel(rel) {
  // rel like "getting-started/local.mdx" -> "getting-started/local"
  // "index.mdx" -> "" ; "deploy.mdx" -> "deploy"
  const noExt = rel.replace(/\.mdx?$/, '')
  return noExt === 'index' ? '' : noExt.replace(/\/index$/, '')
}

async function convertFile(srcFileAbs, versionDir, version) {
  let content = await readFile(srcFileAbs, 'utf8')
  const rel = relative(versionDir, srcFileAbs)
  const fallback = humanize(rel.split('/').pop().replace(/\.mdx?$/, ''))

  content = stripImports(content)
  content = rewriteImages(content, srcFileAbs)
  content = rewriteDocLinks(content, version)
  const { title, body } = extractTitle(content, fallback)

  const editUrl = `${EDIT_BASE}/${posix.normalize(relative(REPO_ROOT, srcFileAbs))}`
  const slug = slugFromRel(rel)
  const frontmatter =
    `---\n` +
    `title: ${JSON.stringify(title)}\n` +
    `editUrl: ${JSON.stringify(editUrl)}\n` +
    `version: ${JSON.stringify(version)}\n` +
    `slug: ${JSON.stringify(`${version}${slug ? `/${slug}` : ''}`)}\n` +
    `---\n\n`

  return { out: `${frontmatter}${body.trim()}\n`, slug, title }
}

// Build a grouped sidebar from a version's page list.
function buildNav(pages, version) {
  const base = `/${version}`
  const byPath = new Map(pages.map((p) => [p.slug, p]))
  const topLevel = pages.filter((p) => p.slug && !p.slug.includes('/'))
  const dirs = new Map() // dir -> [child pages]
  for (const p of pages) {
    if (!p.slug.includes('/')) continue
    const dir = p.slug.split('/')[0]
    if (!dirs.has(dir)) dirs.set(dir, [])
    dirs.get(dir).push(p)
  }

  const groups = []
  const index = byPath.get('')
  if (index) groups.push({ label: index.title || 'Introduction', link: base })

  const usedTop = new Set()
  const orderedDirs = [
    ...SECTION_ORDER.filter((d) => dirs.has(d)),
    ...[...dirs.keys()].filter((d) => !SECTION_ORDER.includes(d)).sort(),
  ]

  for (const dir of orderedDirs) {
    const children = dirs.get(dir)
    const overview = topLevel.find((p) => p.slug === dir)
    if (overview) usedTop.add(overview.slug)
    const items = []
    if (overview) items.push({ label: 'Overview', link: `${base}/${overview.slug}` })
    children
      .map((c) => ({ label: c.title || humanize(c.slug.split('/').pop()), link: `${base}/${c.slug}`, slug: c.slug }))
      .sort((a, b) => a.label.localeCompare(b.label))
      .forEach((it) => items.push({ label: it.label, link: it.link }))
    groups.push({ label: humanize(dir), items })
  }

  // Top-level pages that aren't a section overview become a "More" group.
  const leftovers = topLevel
    .filter((p) => !usedTop.has(p.slug))
    .map((p) => ({ label: p.title || humanize(p.slug), link: `${base}/${p.slug}` }))
    .sort((a, b) => a.label.localeCompare(b.label))
  if (leftovers.length) groups.push({ label: 'More', items: leftovers })

  return groups
}

async function main() {
  if (!existsSync(VERSIONS_DIR)) {
    throw new Error(
      `No docs/versions found. Create the first snapshot:\n` +
        `  cd apps/docs && node scripts/snapshot-version.mjs v0.3`
    )
  }

  const versionDirs = (await readdir(VERSIONS_DIR, { withFileTypes: true }))
    .filter((e) => e.isDirectory() && VERSION_RE.test(e.name))
    .map((e) => e.name)
    .sort(compareVersionsDesc)

  if (versionDirs.length === 0) {
    throw new Error(`docs/versions has no version folders (expected e.g. v0.3).`)
  }
  const latest = versionDirs[0]

  await rm(DEST_DIR, { recursive: true, force: true })
  await mkdir(DEST_DIR, { recursive: true })
  await mkdir(GEN_DIR, { recursive: true })
  await mkdir(PUBLIC_DIR, { recursive: true })

  const nav = {}
  let total = 0
  for (const version of versionDirs) {
    const versionDir = join(VERSIONS_DIR, version)
    const files = await walk(versionDir)
    const pages = []
    for (const file of files) {
      const { out, slug, title } = await convertFile(file, versionDir, version)
      const rel = relative(versionDir, file).replace(/\.mdx?$/, '.md')
      const dest = join(DEST_DIR, version, rel)
      await mkdir(dirname(dest), { recursive: true })
      await writeFile(dest, out, 'utf8')
      pages.push({ slug, title })
      total++
    }
    nav[version] = buildNav(pages, version)
  }

  await writeFile(
    join(GEN_DIR, 'versions.json'),
    JSON.stringify({ versions: versionDirs, latest }, null, 2),
    'utf8'
  )
  await writeFile(join(GEN_DIR, 'nav.json'), JSON.stringify(nav, null, 2), 'utf8')

  // Cloudflare _redirects: static assets win over redirects, so versioned
  // paths (/v0.3/…) are served as files; only unmatched bare paths fall through
  // to the latest version. Keeps old unversioned links alive.
  const redirects = [
    `/            /${latest}/        302`,
    `/*           /${latest}/:splat   302`,
    '',
  ].join('\n')
  await writeFile(join(PUBLIC_DIR, '_redirects'), redirects, 'utf8')

  console.log(
    `[sync-docs] ${total} page(s) across ${versionDirs.length} version(s); latest=${latest}`
  )
}

await main()
