/**
 * Open Graph (OG) image generator for all chmonitor apps.
 *
 * Pipeline: Satori (HTML/CSS object tree -> SVG) + @resvg/resvg-js (SVG -> PNG).
 * Fonts are vendored under `assets/og-fonts/` so generation is hermetic — no
 * network access — and safe to run inside CI deploy jobs (see cloudflare.yml).
 * The PNGs are also committed so local dev and build-check workflows have a
 * baseline without running this script.
 *
 * Run:  bun run og:generate   (alias for `bun run scripts/generate-og-images.ts`)
 *
 * The 3 app-level cards (landing, docs, dashboard home) live in the CARDS array
 * below. Per-page dashboard cards are derived from the shared OG registry in
 * `apps/dashboard/src/lib/og.ts` — add a page there (one entry feeds both this
 * image and the route <head> meta), then re-run and commit.
 */

import { OG_PAGES } from '../apps/dashboard/src/lib/og'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import satori from 'satori'

const ROOT = join(import.meta.dir, '..')
const FONT_DIR = join(ROOT, 'assets/og-fonts')

// Brand palette — mirrors apps/landing Base.astro :root tokens.
const BG = '#09090b'
const FG = '#fafafa'
const MUTED = '#a1a1aa'
const AMBER = '#f59e0b'
const ORANGE = '#f97316'

const WIDTH = 1200
const HEIGHT = 630

// ClickHouse mark (yellow bars), recolored to the amber brand accent.
const LOGO_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="${AMBER}" d="M21.333 10H24v4h-2.667ZM16 1.335h2.667v21.33H16Zm-5.333 0h2.666v21.33h-2.666ZM0 22.665V1.335h2.667v21.33zm5.333-21.33H8v21.33H5.333Z"/></svg>`
const LOGO_DATA_URI = `data:image/svg+xml;base64,${Buffer.from(LOGO_SVG).toString('base64')}`

type Card = {
  /** Output paths relative to repo root; one card can fan out to many apps. */
  out: string[]
  eyebrow: string
  title: string
  description: string
  domain: string
}

const TAGLINE = 'Open-source ClickHouse monitoring'

const CARDS: Card[] = [
  {
    out: ['apps/landing/public/og/og.png'],
    eyebrow: 'OPEN SOURCE',
    title: 'A simple UI to monitor ClickHouse',
    description:
      'Queries, merges, parts, replication, health and an AI agent. Self-host it or use the cloud.',
    domain: 'chmonitor.dev',
  },
  {
    out: ['apps/docs/public/og/og.png'],
    eyebrow: 'DOCUMENTATION',
    title: 'chmonitor Documentation',
    description:
      'Setup, configuration, query monitoring, the AI agent, MCP server and deployment guides.',
    domain: 'docs.chmonitor.dev',
  },
  {
    out: ['apps/dashboard/public/og/og.png'],
    eyebrow: 'DASHBOARD',
    title: 'ClickHouse Monitoring Dashboard',
    description:
      'Real-time insight into clusters via system tables — metrics, query performance and health.',
    domain: 'dash.chmonitor.dev',
  },
  // Per-page dashboard cards are derived from the shared OG registry so the
  // image text and the route <head> meta never drift. Add a page there, not here.
  ...Object.entries(OG_PAGES).map(([slug, page]) => ({
    out: [`apps/dashboard/public/og/og-${slug}.png`],
    eyebrow: page.eyebrow,
    title: page.title,
    description: page.description,
    domain: 'dash.chmonitor.dev',
  })),
]

/** Tiny hyperscript helper so we avoid a JSX toolchain in this standalone script. */
function h(type: string, style: Record<string, unknown>, children?: unknown) {
  return { type, props: { style, children } }
}

/** Satori reads img `src`/`width`/`height` from props directly, not from style. */
function img(src: string, width: number, height: number) {
  return { type: 'img', props: { src, width, height } }
}

function buildTree(card: Card) {
  return h(
    'div',
    {
      width: WIDTH,
      height: HEIGHT,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      backgroundColor: BG,
      padding: '72px 80px',
      fontFamily: 'Inter',
      position: 'relative',
    },
    [
      // Accent gradient bar pinned to the top edge.
      h('div', {
        position: 'absolute',
        top: 0,
        left: 0,
        width: WIDTH,
        height: 10,
        backgroundImage: `linear-gradient(90deg, ${AMBER}, ${ORANGE})`,
      }),
      // Header: logo mark + wordmark.
      h('div', { display: 'flex', alignItems: 'center', gap: 18 }, [
        img(LOGO_DATA_URI, 44, 44),
        h(
          'div',
          {
            fontSize: 34,
            fontWeight: 700,
            color: FG,
            letterSpacing: '-0.02em',
          },
          'chmonitor'
        ),
      ]),
      // Body: eyebrow + title + description.
      h('div', { display: 'flex', flexDirection: 'column', gap: 22 }, [
        h(
          'div',
          {
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: '0.18em',
            color: AMBER,
          },
          card.eyebrow
        ),
        h(
          'div',
          {
            fontSize: 68,
            fontWeight: 700,
            color: FG,
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            maxWidth: 980,
          },
          card.title
        ),
        h(
          'div',
          { fontSize: 30, color: MUTED, lineHeight: 1.4, maxWidth: 940 },
          card.description
        ),
      ]),
      // Footer: domain + tagline.
      h(
        'div',
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        [
          h('div', { fontSize: 26, fontWeight: 600, color: FG }, card.domain),
          h('div', { fontSize: 22, color: MUTED }, TAGLINE),
        ]
      ),
    ]
  )
}

async function loadFont(file: string): Promise<Buffer> {
  return readFile(join(FONT_DIR, file))
}

async function main() {
  const [regular, semibold, bold] = await Promise.all([
    loadFont('Inter-Regular.ttf'),
    loadFont('Inter-SemiBold.ttf'),
    loadFont('Inter-Bold.ttf'),
  ])

  const fonts = [
    {
      name: 'Inter',
      data: regular,
      weight: 400 as const,
      style: 'normal' as const,
    },
    {
      name: 'Inter',
      data: semibold,
      weight: 600 as const,
      style: 'normal' as const,
    },
    {
      name: 'Inter',
      data: bold,
      weight: 700 as const,
      style: 'normal' as const,
    },
  ]

  for (const card of CARDS) {
    const svg = await satori(buildTree(card) as never, {
      width: WIDTH,
      height: HEIGHT,
      fonts,
    })
    const png = new Resvg(svg, {
      fitTo: { mode: 'width', value: WIDTH },
    })
      .render()
      .asPng()

    for (const rel of card.out) {
      const abs = join(ROOT, rel)
      await mkdir(dirname(abs), { recursive: true })
      await writeFile(abs, png)
      console.log(`  ✓ ${rel} (${(png.length / 1024).toFixed(0)} KB)`)
    }
  }
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
