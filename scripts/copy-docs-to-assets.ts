#!/usr/bin/env bun

/**
 * Copies prerendered docs HTML from `.next/server/app/docs*` into
 * `.open-next/assets/docs*` so the Cloudflare ASSETS binding serves them
 * directly without invoking the Worker.
 *
 * OpenNext routes SSG pages (those that use `generateStaticParams`) through
 * the KV incremental cache by default. The docs route uses `dynamicParams =
 * false` and prerenders every slug at build time, so the HTML is effectively
 * static and can be served straight from the assets bucket.
 *
 * Cloudflare's default `html_handling = "auto-trailing-slash"` maps
 *   /docs           → docs.html
 *   /docs/features  → docs/features.html
 * automatically.
 */

import { copyFileSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const SOURCE_ROOT = path.join(process.cwd(), '.next/server/app')
const TARGET_ROOT = path.join(process.cwd(), '.open-next/assets')

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) yield* walk(full)
    else yield full
  }
}

const copied: string[] = []

for (const source of walk(SOURCE_ROOT)) {
  const rel = path.relative(SOURCE_ROOT, source)
  const isDocsHtml =
    rel.endsWith('.html') && (rel === 'docs.html' || rel.startsWith('docs/'))
  if (!isDocsHtml) continue

  const target = path.join(TARGET_ROOT, rel)
  mkdirSync(path.dirname(target), { recursive: true })
  copyFileSync(source, target)
  copied.push(rel)
}

if (copied.length === 0) {
  console.error(
    'No prerendered docs HTML found under .next/server/app. Did the docs route fail to prerender?'
  )
  process.exit(1)
}

console.log(`Copied ${copied.length} docs HTML files to .open-next/assets/`)
for (const rel of copied) console.log(`  ${rel}`)
