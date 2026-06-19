/**
 * Cross-route contract guard: no API route may validate a `Number(...)`-parsed
 * hostId with the loose `!Number.isFinite(hostId)` check.
 *
 * `Number.isFinite` accepts negative (`-1`) and fractional (`1.5`) values, both
 * of which are invalid host-array indices that slip past the boundary and only
 * fail later in `getAndValidateClientConfig` as a 500. The required check is
 * `!Number.isInteger(hostId) || hostId < 0` (a non-negative integer), matching
 * lib/api/shared/validators/host-id.ts and routes like /api/v1/overview.
 *
 * This is a structural guard so the whole class of routes — and any future
 * route — stays consistent, complementing the behavioral test in
 * charts/__tests__/hostid-validation.test.ts.
 */
import { describe, expect, test } from 'bun:test'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// `src/routes/api` — the directory above this `__tests__` folder. Uses the
// portable import.meta.url form (tsc doesn't type Bun's import.meta.dir).
const API_ROOT = fileURLToPath(new URL('..', import.meta.url))

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry === '__tests__') continue
      out.push(...walk(full))
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      out.push(full)
    }
  }
  return out
}

describe('API hostId validation contract', () => {
  const files = walk(API_ROOT)

  test('discovers a meaningful number of route files', () => {
    expect(files.length).toBeGreaterThan(20)
  })

  test('no route uses the loose !Number.isFinite(hostId) boundary check', () => {
    const offenders = files.filter((f) =>
      readFileSync(f, 'utf8').includes('!Number.isFinite(hostId)')
    )
    if (offenders.length > 0) {
      const rel = offenders.map((f) => f.slice(API_ROOT.length + 1))
      throw new Error(
        `Routes using the loose hostId check (accepts -1 / 1.5). Use ` +
          `\`!Number.isInteger(hostId) || hostId < 0\` instead:\n  ${rel.join('\n  ')}`
      )
    }
    expect(offenders).toHaveLength(0)
  })

  test('routes that parse hostId reject negatives and non-integers', () => {
    // Every file that derives `const hostId = Number(...)` must also guard with
    // the non-negative-integer check (allowing for differing whitespace).
    const parsing = files.filter((f) => {
      const src = readFileSync(f, 'utf8')
      return /const hostId = Number\(/.test(src)
    })
    expect(parsing.length).toBeGreaterThan(0)

    const missingGuard = parsing.filter((f) => {
      const src = readFileSync(f, 'utf8')
      // Accept either the inline negated guard or a (local/shared)
      // isValidHostId()-style helper, both of which enforce
      // `Number.isInteger(hostId) && hostId >= 0`.
      const hasInlineGuard =
        /Number\.isInteger\(hostId\)\s*\|\|\s*hostId\s*<\s*0/.test(src)
      const hasHelperGuard = /isValidHostId\s*\(/.test(src)
      return !hasInlineGuard && !hasHelperGuard
    })
    if (missingGuard.length > 0) {
      const rel = missingGuard.map((f) => f.slice(API_ROOT.length + 1))
      throw new Error(
        `Routes parse hostId via Number(...) but lack the ` +
          `\`!Number.isInteger(hostId) || hostId < 0\` guard:\n  ${rel.join('\n  ')}`
      )
    }
    expect(missingGuard).toHaveLength(0)
  })
})
