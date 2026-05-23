#!/usr/bin/env bun

/**
 * Copies every prerendered HTML file from `.next/server/app/` into
 * `.open-next/assets/` so the Cloudflare ASSETS binding serves them directly
 * without invoking the Worker.
 *
 * Cloudflare's default `html_handling = "auto-trailing-slash"` maps:
 *   /overview          → overview.html
 *   /docs              → docs.html
 *   /docs/features     → docs/features.html
 *
 * Pairs with `stub-prerendered-handlers.ts`, which empties the corresponding
 * page handlers in `.next/server/app/` so they tree-shake out of `handler.mjs`.
 * Together: page requests are served by ASSETS, the Worker only handles /api/*.
 *
 * For prerendered route-handler outputs (e.g. `icon.svg.body`), we also
 * preserve the Content-Type and Cache-Control from the sibling `.meta` file
 * by appending entries to `.open-next/assets/_headers` — Cloudflare's default
 * MIME inference goes off filename extension, which is unreliable when Next's
 * `.body` files have URL paths without an extension.
 */

import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
} from 'node:fs'
import path from 'node:path'

const SOURCE_ROOT = path.join(process.cwd(), '.next/server/app')
const TARGET_ROOT = path.join(process.cwd(), '.open-next/assets')
const HEADERS_FILE = path.join(TARGET_ROOT, '_headers')

if (!existsSync(SOURCE_ROOT)) {
  console.error(
    `Source root not found: ${SOURCE_ROOT}. Did the Next.js build run before this script?`
  )
  process.exit(1)
}

if (!existsSync(TARGET_ROOT)) {
  console.error(
    `Target root not found: ${TARGET_ROOT}. Did opennextjs-cloudflare build run before this script?`
  )
  process.exit(1)
}

// `_not-found.html` is Next's 404 page. Serving it via ASSETS would return
// HTTP 200 (Cloudflare can't apply Next's prerender-manifest initialStatus:404),
// turning the literal /_not-found URL into a false-positive 200. Leave it in
// the Worker so Next's runtime can apply the 404 status.
const HTML_EXCLUDES = new Set(['_not-found.html'])

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) yield* walk(full)
    else yield full
  }
}

interface RouteMeta {
  status?: number
  headers?: Record<string, string>
}

const headerEntries: string[] = []

function emitHeaderEntry(urlPath: string, metaFile: string): void {
  let meta: RouteMeta
  try {
    meta = JSON.parse(readFileSync(metaFile, 'utf-8')) as RouteMeta
  } catch {
    return
  }
  const headers = meta.headers ?? {}
  // Cloudflare's _headers cares about Content-Type + Cache-Control most;
  // x-next-* are Next-internal, not useful here.
  const KEEP = new Set(['content-type', 'cache-control'])
  const kept: [string, string][] = []
  for (const [k, v] of Object.entries(headers)) {
    if (KEEP.has(k.toLowerCase())) kept.push([k, v])
  }
  if (kept.length === 0) return
  headerEntries.push(`/${urlPath}`)
  for (const [k, v] of kept) headerEntries.push(`  ${k}: ${v}`)
  headerEntries.push('')
}

const copied: string[] = []
const skipped: string[] = []

for (const source of walk(SOURCE_ROOT)) {
  // `.next/server/app` mirrors URL paths (route groups like `(dashboard)` are
  // stripped, so `/overview` lives at `.next/server/app/overview.html`).
  //
  // We copy two kinds of prerendered output:
  //   • `.html` — page output, served as-is.
  //   • `.body` — route-handler output (e.g. `icon.svg.body`). The sibling
  //     `.meta` file holds the real Content-Type; we copy that into `_headers`.
  let rel: string
  let metaFile: string | null = null
  if (source.endsWith('.html')) {
    rel = path.relative(SOURCE_ROOT, source)
    if (HTML_EXCLUDES.has(rel)) {
      skipped.push(`${rel} (intentionally kept in Worker)`)
      continue
    }
  } else if (source.endsWith('.body')) {
    rel = path.relative(SOURCE_ROOT, source).replace(/\.body$/, '')
    const sibling = source.replace(/\.body$/, '.meta')
    if (existsSync(sibling)) metaFile = sibling
  } else {
    continue
  }

  const target = path.join(TARGET_ROOT, rel)
  mkdirSync(path.dirname(target), { recursive: true })
  copyFileSync(source, target)
  const urlPath = rel.split(path.sep).join('/')
  if (metaFile) emitHeaderEntry(urlPath, metaFile)
  copied.push(urlPath)
}

if (copied.length === 0) {
  console.error(
    'No prerendered HTML or .body files found under .next/server/app.'
  )
  process.exit(1)
}

if (headerEntries.length > 0) {
  // Append rather than overwrite — opennext writes its own _headers entries
  // for /_next/* immutable bundles, and we must not stomp them. The Cloudflare
  // _headers format is line-based; appending is safe.
  appendFileSync(
    HEADERS_FILE,
    `\n# Content-Type/Cache-Control preserved from Next prerender .meta files\n${headerEntries.join('\n')}\n`
  )
}

console.log(`Copied ${copied.length} prerendered files to .open-next/assets/`)
for (const rel of copied) console.log(`  ${rel}`)
if (skipped.length > 0) {
  console.log(`Skipped ${skipped.length}:`)
  for (const rel of skipped) console.log(`  ${rel}`)
}
if (headerEntries.length > 0) {
  console.log(
    `Appended ${headerEntries.filter((l) => l.startsWith('/')).length} _headers entries from .meta files.`
  )
}
