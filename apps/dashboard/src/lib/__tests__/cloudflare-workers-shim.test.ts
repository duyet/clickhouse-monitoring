import { describe, expect, test } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

// Dual-runtime guard. The Node build (Nitro `node-server`, i.e. the Docker/k8s
// image) resolves the virtual module `cloudflare:workers` to
// src/lib/cloudflare-workers-shim.ts, which only re-exports `env` (backed by
// process.env). Any OTHER symbol imported from `cloudflare:workers`
// (WorkerEntrypoint, DurableObject, ExecutionContext, QueueExporter, …) would
// be `undefined` at runtime under Node and break the Node target silently —
// while still building & passing on the Cloudflare Worker target.
//
// This test enforces the contract: across the whole app source, the only
// permitted value import from `cloudflare:workers` is `{ env }`. If you
// genuinely need another binding, re-export it from cloudflare-workers-shim.ts
// first (and keep it Node-safe), then it is automatically allowed here.
// See docs/knowledge/k8s-health-probes.md → "Dual-runtime" section.

const SRC_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const ALLOWED = new Set(['env'])
const IMPORT_RE = /import\s*\{([^}]*)\}\s*from\s*['"]cloudflare:workers['"]/g

function listSourceFiles(): string[] {
  const entries = readdirSync(SRC_ROOT, {
    recursive: true,
  }) as unknown as string[]
  return entries.filter((f) => {
    const s = String(f)
    return (
      (s.endsWith('.ts') || s.endsWith('.tsx')) &&
      !s.includes('__tests__') &&
      !s.endsWith('.test.ts') &&
      !s.endsWith('.test.tsx') &&
      // The shim is the alias TARGET for the Node build; it does not import the
      // virtual module itself, so it is out of scope by construction.
      !s.endsWith('cloudflare-workers-shim.ts')
    )
  })
}

describe('cloudflare:workers dual-runtime contract', () => {
  test('only `env` may be imported from cloudflare:workers (Node-build guard)', () => {
    const offenders: string[] = []

    for (const rel of listSourceFiles()) {
      const abs = join(SRC_ROOT, rel)
      const src = readFileSync(abs, 'utf8')
      for (const match of src.matchAll(IMPORT_RE)) {
        const symbols = match[1]!
          .split(',')
          .map((raw) =>
            raw
              .replace(/\bas\s+\w+/g, '')
              .replace(/\btype\b/g, '')
              .trim()
          )
          .filter(Boolean)
        for (const sym of symbols) {
          if (!ALLOWED.has(sym)) {
            offenders.push(
              `${relative(SRC_ROOT, abs)} imports \`${sym}\` from cloudflare:workers — ` +
                `re-export it from src/lib/cloudflare-workers-shim.ts (Node-safe) or remove the import.`
            )
          }
        }
      }
    }

    expect(offenders, offenders.join('\n')).toEqual([])
  })
})
