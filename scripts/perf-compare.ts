/**
 * Performance Comparison Script — Win Metrics for #1392
 *
 * Measures the 9 Win Metrics from issue #1392 against both the Next.js
 * dashboard (dash.chmonitor.dev) and the TanStack Start dashboard
 * (dash-tsr.chmonitor.dev).
 *
 * Two phases:
 *   1. Build metrics — build both apps locally, measure time/size/memory
 *   2. Runtime metrics — curl both live deploys for TTFB, page load
 *
 * Output: markdown table suitable for posting to GitHub issue #1392.
 *
 * Run: bun scripts/perf-compare.ts [--skip-build] [--skip-lighthouse]
 */

import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const args = process.argv.slice(2)
const SKIP_BUILD = args.includes('--skip-build')
const SKIP_LIGHTHOUSE = args.includes('--skip-lighthouse')

const NEXT_URL = 'https://dash.chmonitor.dev'
const TSR_URL = 'https://dash-tsr.chmonitor.dev'

// ── Types ──────────────────────────────────────────────

interface BuildMetrics {
  buildTimeMs: number
  workerBundleKiB: number
  outputDirKiB: number
  depCount: number
}

interface RuntimeMetrics {
  coldStartTtfbMs: number
  fullPageLoadMs: number
  htmlSizeKiB: number
  lighthouseFcp?: number
  lighthouseLcp?: number
  lighthouseTti?: number
}

interface AppMetrics {
  name: string
  build: BuildMetrics
  runtime: RuntimeMetrics
}

// ── Helpers ────────────────────────────────────────────

function run(cmd: string, cwd?: string): string {
  return execSync(cmd, {
    cwd,
    encoding: 'utf-8',
    timeout: 300_000,
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim()
}

function fmt(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

function fmtKiB(kib: number): string {
  return kib > 1024 ? `${(kib / 1024).toFixed(1)} MiB` : `${kib} KiB`
}

function delta(a: number, b: number): string {
  const pct = a === 0 ? 0 : ((b - a) / a) * 100
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}

// ── Build metrics ──────────────────────────────────────

function measureBuild(
  name: string,
  buildCmd: string,
  cwd: string,
  workerBundlePath: string,
  outputDirPath: string,
  packageJsonPath: string
): BuildMetrics {
  console.log(`  Building ${name}...`)

  const start = Date.now()
  run(buildCmd, cwd)
  const buildTimeMs = Date.now() - start

  // Worker bundle size (gzip)
  const gzipSize = parseInt(
    run(`gzip -c ${workerBundlePath} | wc -c | tr -d ' '`),
    10
  )

  // Output dir size
  const dirSize = parseInt(run(`du -sk ${outputDirPath} | cut -f1`), 10)

  // Dependency count
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
  const depCount =
    Object.keys(pkg.dependencies || {}).length +
    Object.keys(pkg.devDependencies || {}).length

  console.log(
    `    ${fmt(buildTimeMs)} | ${fmtKiB(Math.round(gzipSize / 1024))} bundle | ${depCount} deps`
  )

  return {
    buildTimeMs,
    workerBundleKiB: Math.round(gzipSize / 1024),
    outputDirKiB: dirSize,
    depCount,
  }
}

// ── Runtime metrics ────────────────────────────────────

async function measureRuntime(
  name: string,
  baseUrl: string
): Promise<RuntimeMetrics> {
  console.log(`  Measuring ${name} at ${baseUrl}...`)

  // Cold-start TTFB (hit /api/health which is lightweight)
  const ttfbStart = Date.now()
  const ttfbRes = await fetch(`${baseUrl}/api/health`, {
    signal: AbortSignal.timeout(30_000),
  })
  await ttfbRes.text()
  const coldStartTtfbMs = Date.now() - ttfbStart

  // Full page load (overview page)
  const pageStart = Date.now()
  const pageRes = await fetch(`${baseUrl}/overview?host=0`, {
    signal: AbortSignal.timeout(30_000),
  })
  const pageBody = await pageRes.text()
  const fullPageLoadMs = Date.now() - pageStart
  const htmlSizeKiB = Math.round(Buffer.byteLength(pageBody) / 1024)

  // Lighthouse (optional, requires Chrome + npx)
  let lighthouseFcp: number | undefined
  let lighthouseLcp: number | undefined
  let lighthouseTti: number | undefined

  if (!SKIP_LIGHTHOUSE) {
    try {
      console.log(`    Running Lighthouse...`)
      const lhOutput = `/tmp/lighthouse-${name}.json`
      run(
        `npx --yes lighthouse ${baseUrl}/overview?host=0 --output=json --output-path=${lhOutput} --chrome-flags="--headless --no-sandbox" --only-categories=performance 2>/dev/null`
      )
      const lh = JSON.parse(readFileSync(lhOutput, 'utf-8'))
      const audits = lh.audits || {}
      lighthouseFcp = audits['first-contentful-paint']?.numericValue
      lighthouseLcp = audits['largest-contentful-paint']?.numericValue
      lighthouseTti = audits.interactive?.numericValue
      console.log(
        `    FCP=${lighthouseFcp ? fmt(lighthouseFcp) : 'N/A'} LCP=${lighthouseLcp ? fmt(lighthouseLcp) : 'N/A'}`
      )
    } catch (e) {
      console.log(`    Lighthouse failed: ${e}`)
    }
  }

  console.log(
    `    TTFB=${fmt(coldStartTtfbMs)} | page=${fmt(fullPageLoadMs)} | HTML=${htmlSizeKiB}KiB`
  )

  return {
    coldStartTtfbMs,
    fullPageLoadMs,
    htmlSizeKiB,
    lighthouseFcp,
    lighthouseLcp,
    lighthouseTti,
  }
}

// ── Markdown output ────────────────────────────────────

function renderMarkdown(next: AppMetrics, tsr: AppMetrics): string {
  const lines: string[] = []

  lines.push('### Performance Comparison — Win Metrics (#1392)')
  lines.push('')
  lines.push(
    `_Measured ${new Date().toISOString().replace('T', ' ').slice(0, 19)}_`
  )
  lines.push('')

  // Build metrics table
  lines.push('#### Build Metrics')
  lines.push('')
  lines.push('| Metric | Next.js (dash) | TSR (dash-tsr) | Delta |')
  lines.push('|--------|---------------|----------------|--------|')
  lines.push(
    `| Build time | ${fmt(next.build.buildTimeMs)} | ${fmt(tsr.build.buildTimeMs)} | ${delta(next.build.buildTimeMs, tsr.build.buildTimeMs)} |`
  )
  lines.push(
    `| Worker bundle (gzip) | ${fmtKiB(next.build.workerBundleKiB)} | ${fmtKiB(tsr.build.workerBundleKiB)} | ${delta(next.build.workerBundleKiB, tsr.build.workerBundleKiB)} |`
  )
  lines.push(
    `| Output dir size | ${fmtKiB(next.build.outputDirKiB)} | ${fmtKiB(tsr.build.outputDirKiB)} | ${delta(next.build.outputDirKiB, tsr.build.outputDirKiB)} |`
  )
  lines.push(
    `| Dep count | ${next.build.depCount} | ${tsr.build.depCount} | ${delta(next.build.depCount, tsr.build.depCount)} |`
  )

  // Runtime metrics table
  lines.push('')
  lines.push('#### Runtime Metrics (live deployment)')
  lines.push('')
  lines.push('| Metric | Next.js (dash) | TSR (dash-tsr) | Delta |')
  lines.push('|--------|---------------|----------------|--------|')
  lines.push(
    `| Cold-start TTFB | ${fmt(next.runtime.coldStartTtfbMs)} | ${fmt(tsr.runtime.coldStartTtfbMs)} | ${delta(next.runtime.coldStartTtfbMs, tsr.runtime.coldStartTtfbMs)} |`
  )
  lines.push(
    `| Full page load | ${fmt(next.runtime.fullPageLoadMs)} | ${fmt(tsr.runtime.fullPageLoadMs)} | ${delta(next.runtime.fullPageLoadMs, tsr.runtime.fullPageLoadMs)} |`
  )
  lines.push(
    `| HTML size | ${next.runtime.htmlSizeKiB} KiB | ${tsr.runtime.htmlSizeKiB} KiB | ${delta(next.runtime.htmlSizeKiB, tsr.runtime.htmlSizeKiB)} |`
  )

  if (
    next.runtime.lighthouseFcp !== undefined &&
    tsr.runtime.lighthouseFcp !== undefined
  ) {
    lines.push(
      `| FCP | ${fmt(next.runtime.lighthouseFcp)} | ${fmt(tsr.runtime.lighthouseFcp)} | ${delta(next.runtime.lighthouseFcp, tsr.runtime.lighthouseFcp)} |`
    )
    lines.push(
      `| LCP | ${fmt(next.runtime.lighthouseLcp!)} | ${fmt(tsr.runtime.lighthouseLcp!)} | ${delta(next.runtime.lighthouseLcp!, tsr.runtime.lighthouseLcp!)} |`
    )
    lines.push(
      `| TTI | ${fmt(next.runtime.lighthouseTti!)} | ${fmt(tsr.runtime.lighthouseTti!)} | ${delta(next.runtime.lighthouseTti!, tsr.runtime.lighthouseTti!)} |`
    )
  }

  return lines.join('\n')
}

// ── Main ───────────────────────────────────────────────

async function main() {
  const root = new URL('..', import.meta.url).pathname

  let nextBuild: BuildMetrics
  let tsrBuild: BuildMetrics

  if (SKIP_BUILD) {
    console.log('⏭️  Skipping build (using --skip-build)\n')
    // Use known values from README
    nextBuild = {
      buildTimeMs: 116_000,
      workerBundleKiB: 2_708,
      outputDirKiB: 0,
      depCount: 142,
    }
    tsrBuild = {
      buildTimeMs: 9_000,
      workerBundleKiB: 1_793,
      outputDirKiB: 0,
      depCount: 83,
    }
  } else {
    console.log('📦 Phase 1: Build metrics\n')
    nextBuild = measureBuild(
      'Next.js (dashboard)',
      'bun run cf:build',
      `${root}apps/dashboard`,
      `${root}apps/dashboard/.open-next/assets/_worker.js`, // approximate
      `${root}apps/dashboard/.open-next`,
      `${root}apps/dashboard/package.json`
    )
    tsrBuild = measureBuild(
      'TSR (dashboard-tsr)',
      'bun run build',
      `${root}apps/dashboard-tsr`,
      `${root}apps/dashboard-tsr/dist/server/index.js`,
      `${root}apps/dashboard-tsr/dist`,
      `${root}apps/dashboard-tsr/package.json`
    )
  }

  console.log('\n🌐 Phase 2: Runtime metrics\n')
  const nextRuntime = await measureRuntime('Next.js', NEXT_URL)
  const tsrRuntime = await measureRuntime('TSR', TSR_URL)

  const next: AppMetrics = {
    name: 'Next.js',
    build: nextBuild,
    runtime: nextRuntime,
  }
  const tsr: AppMetrics = { name: 'TSR', build: tsrBuild, runtime: tsrRuntime }

  console.log('\n📊 Markdown output:\n')
  const md = renderMarkdown(next, tsr)
  console.log(md)
  console.log(
    '\n_Post this output as a comment on https://github.com/duyet/clickhouse-monitoring/issues/1392_\n'
  )
}

main().catch((err) => {
  console.error('Perf compare failed:', err)
  process.exit(2)
})
