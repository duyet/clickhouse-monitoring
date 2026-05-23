#!/usr/bin/env bun

/**
 * Restores the page/route handlers that `stub-prerendered-handlers.ts`
 * replaced with stubs. Runs as the LAST step of `cf:build` so that:
 *
 *   1. opennextjs-cloudflare has already bundled the stubs into
 *      `.open-next/server-functions/default/handler.mjs` — the deployable
 *      worker keeps the size win.
 *   2. `.next/standalone/` is back to its original state, so `bun run start`
 *      (which executes `.next/standalone/server.js`) serves real pages.
 *   3. The backup directory at `.cf-stub-backup/` is cleaned up.
 *
 * Idempotent. Safe to run when nothing was stubbed — exits silently.
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const BACKUP_ROOT = path.join(ROOT, '.cf-stub-backup')

if (!existsSync(BACKUP_ROOT)) {
  console.log('No stub backup to restore — skipping.')
  process.exit(0)
}

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) yield* walk(full)
    else yield full
  }
}

const restored: string[] = []
for (const backupFile of walk(BACKUP_ROOT)) {
  const rel = path.relative(BACKUP_ROOT, backupFile)
  const target = path.join(ROOT, rel)
  mkdirSync(path.dirname(target), { recursive: true })
  copyFileSync(backupFile, target)
  restored.push(rel)
}

rmSync(BACKUP_ROOT, { recursive: true, force: true })

console.log(`Restored ${restored.length} handler files from backup.`)
