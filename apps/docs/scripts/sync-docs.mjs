// Transform the working docs (docs/content/**) into the Starlight content
// collection (apps/docs/src/content/docs/**). Runs as a prebuild step
// (package.json: `node scripts/sync-docs.mjs && astro build`).
//
// docs/content/** is the single committed source of truth. Everything this
// writes under src/content/docs/** is a generated artifact and is gitignored.
// There is no per-release versioning: the working docs are served at the root.
//
// Per-file conversions:
//   - parse existing YAML frontmatter (title/description) if present
//   - strip `nextra/components` / `lucide-react` imports (legacy authoring)
//   - first `# Heading` -> frontmatter `title`; remove it from the body
//     (Starlight renders the title as the page h1); demote any other `# ` to `## `
//   - `/docs/X` links     -> `/X`
//   - local image paths   -> raw.githubusercontent.com URLs
//   - emit a per-page `editUrl` pointing at the real .mdx source on GitHub
//
// Section landing pages (a top-level `<section>.mdx` that also has a
// `<section>/` directory, e.g. deploy.mdx + deploy/) are written as
// `<section>/index.md` so Starlight's `autogenerate` sidebar lists them.

import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, posix, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '../../..')
const SRC_DIR = resolve(REPO_ROOT, 'docs/content')
const DEST_DIR = resolve(__dirname, '../src/content/docs')
const RAW_BASE = 'https://raw.githubusercontent.com/duyet/clickhouse-monitoring/main'
const EDIT_BASE = 'https://github.com/duyet/clickhouse-monitoring/edit/main'

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
// Minimal parser: only the `key: value` pairs we emit (title, description).
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
    ''
  )
}

// Remove the first top-level `# Heading` (it becomes the page title), and
// demote any remaining `# ` to `## ` so there is a single document title.
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
  const body = lines.join('\n').replace(/^#\s+(.+)$/gm, '## $1')
  return { title, body }
}

// `/docs/deploy` -> `/deploy`, `/docs` -> `/`
function rewriteDocLinks(src) {
  return src.replace(/\]\((\/docs(?:\/[^)#]*)?)((?:#[^)]*)?)\)/g, (_m, path, hash) => {
    const target = path.replace(/^\/docs/, '') || '/'
    return `](${target}${hash})`
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

function humanize(slug) {
  return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

async function main() {
  if (!existsSync(SRC_DIR)) {
    throw new Error(`Source docs not found at ${SRC_DIR}`)
  }

  // Top-level names that also have a sibling directory → section landings.
  const topEntries = await readdir(SRC_DIR, { withFileTypes: true })
  const sectionDirs = new Set(
    topEntries.filter((e) => e.isDirectory()).map((e) => e.name)
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
    content = rewriteDocLinks(content)

    const fallback = humanize(noExt.split('/').pop())
    const { title: h1Title, body } = extractTitle(content, fallback)
    const title = fm.title || h1Title

    const editUrl = `${EDIT_BASE}/${posix.normalize(relative(REPO_ROOT, fileAbs))}`

    // deploy.mdx + deploy/ -> deploy/index.md (Starlight section landing).
    const destRel = isSectionLanding ? `${noExt}/index.md` : `${noExt}.md`
    const dest = join(DEST_DIR, destRel)

    let frontmatter = `---\ntitle: ${JSON.stringify(title)}\n`
    if (fm.description) frontmatter += `description: ${JSON.stringify(fm.description)}\n`
    frontmatter += `editUrl: ${JSON.stringify(editUrl)}\n`
    if (isSectionLanding) {
      // Show the landing first in its sidebar group, labelled "Overview".
      frontmatter += `sidebar:\n  label: Overview\n  order: 0\n`
    }
    frontmatter += `---\n\n`

    await mkdir(dirname(dest), { recursive: true })
    await writeFile(dest, `${frontmatter}${body.trim()}\n`, 'utf8')
    total++
  }

  console.log(`[sync-docs] ${total} page(s) -> src/content/docs (served at /)`)
}

await main()
