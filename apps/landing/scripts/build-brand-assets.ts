/**
 * Single source of truth for the chmonitor brand asset kit.
 *
 * The mark is FLAT: five orange metric bars of varying height on ClickHouse's
 * column grid, with an emerald square top-cap on the left bar (the "live /
 * healthy" signal). No tile, no gradient, no floating ping.
 *
 * Generates every brand file for the landing site (keeping the filenames the
 * site already wires to), plus favicons for the dashboard and docs apps.
 *
 *   cd apps/landing && bun run scripts/build-brand-assets.ts
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const landing = join(here, '..', 'public')
const dashboard = join(here, '..', '..', 'dashboard', 'public')
const docs = join(here, '..', '..', 'docs', 'public')

const ORANGE = '#f97316'
const EMERALD = '#10b981'
const INK = '#09090b'
const PAPER = '#fafafa'

// ── flat mark geometry (viewBox 0 0 32 32) ───────────────────────────────────
// Five bars, common baseline at y=28.5; emerald cap tops the left bar.
const BARS = [
  { x: 3.3, y: 13.05, h: 15.45 },
  { x: 8.7, y: 3.5, h: 25 },
  { x: 14.1, y: 13.25, h: 15.25 },
  { x: 19.5, y: 6.25, h: 22.25 },
  { x: 24.9, y: 16.8, h: 11.7 },
]
const W = 3.8
const CAP = { x: 3.3, y: 9.75, h: 3.3 }

const barRects = (fill: string) =>
  BARS.map(
    (b) =>
      `<rect x="${b.x}" y="${b.y}" width="${W}" height="${b.h}" fill="${fill}"/>`
  ).join('')

// Color mark: orange bars + emerald cap.
const markColor = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="chmonitor">
${barRects(ORANGE)}<rect x="${CAP.x}" y="${CAP.y}" width="${W}" height="${CAP.h}" fill="${EMERALD}"/>
</svg>`

// Monochrome mark: single ink via currentColor (caller drives it with CSS color).
// Cap is split off the body with a hairline gap so it reads as a distinct segment.
const markMono = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="chmonitor">
  <g fill="currentColor">
    <rect x="3.3" y="9.75" width="3.8" height="3.3"/>
    <rect x="3.3" y="13.95" width="3.8" height="14.55"/>
    <rect x="8.7" y="3.5" width="3.8" height="25"/>
    <rect x="14.1" y="13.25" width="3.8" height="15.25"/>
    <rect x="19.5" y="6.25" width="3.8" height="22.25"/>
    <rect x="24.9" y="16.8" width="3.8" height="11.7"/>
  </g>
</svg>`

// Horizontal lockup: mark + wordmark. textFill differs for light/dark.
const lockup = (
  textFill: string
) => `<svg width="208" height="44" viewBox="0 0 208 44" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="chmonitor">
  <title>chmonitor</title>
  <g transform="translate(6 6)">
    ${barRects(ORANGE)}<rect x="${CAP.x}" y="${CAP.y}" width="${W}" height="${CAP.h}" fill="${EMERALD}"/>
  </g>
  <text x="48" y="29" font-family="Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="650" letter-spacing="-.6" fill="${textFill}">chmonitor</text>
</svg>`

// ── raster helpers ───────────────────────────────────────────────────────────
const markBuf = Buffer.from(markColor)

function rasterTransparent(size: number) {
  return sharp(markBuf, { density: 512 })
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()
}

// Color mark on an opaque field with padding. `pad` is the fraction of the
// canvas each side reserves (maskable PWA icons need a generous safe zone).
async function rasterOnField(
  size: number,
  pad: number,
  bg = { r: 255, g: 255, b: 255, alpha: 1 }
) {
  const inner = Math.round(size * (1 - pad * 2))
  const mark = await rasterTransparent(inner)
  return sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toBuffer()
}

// Minimal ICO container wrapping PNG-encoded entries (supported by all current
// browsers). Avoids pulling an extra dependency just for favicon.ico.
function buildIco(entries: { size: number; png: Buffer }[]) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(entries.length, 4)
  const dir = Buffer.alloc(16 * entries.length)
  let offset = 6 + dir.length
  entries.forEach((e, i) => {
    const o = i * 16
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o)
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o + 1)
    dir.writeUInt8(0, o + 2)
    dir.writeUInt8(0, o + 3)
    dir.writeUInt16LE(1, o + 4)
    dir.writeUInt16LE(32, o + 6)
    dir.writeUInt32LE(e.png.length, o + 8)
    dir.writeUInt32LE(offset, o + 12)
    offset += e.png.length
  })
  return Buffer.concat([header, dir, ...entries.map((e) => e.png)])
}

// 1200×630 social card: warm wash, centered lockup + tagline.
async function buildOg() {
  const w = 1200
  const h = 630
  const bg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${w}" height="${h}" fill="#ffffff"/>
    <radialGradient id="g" cx="50%" cy="20%" r="70%">
      <stop offset="0%" stop-color="#f97316" stop-opacity="0.12"/>
      <stop offset="60%" stop-color="#f59e0b" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    <text x="${w / 2}" y="392" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="76" font-weight="700" letter-spacing="-2" fill="${INK}">chmonitor</text>
    <text x="${w / 2}" y="452" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="500" fill="#71717a">Monitor ClickHouse — queries, merges, health &amp; an AI agent</text>
    <rect x="${w / 2 - 70}" y="520" width="140" height="2" rx="1" fill="#e7e7ea"/>
    <text x="${w / 2}" y="556" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="600" fill="#a1a1aa">dash.chmonitor.dev</text>
  </svg>`
  const mark = await rasterTransparent(150)
  return sharp(Buffer.from(bg))
    .composite([{ input: mark, top: 150, left: Math.round(w / 2 - 75) }])
    .png()
    .toBuffer()
}

// ── emit ─────────────────────────────────────────────────────────────────────
async function run() {
  await mkdir(join(landing, 'brand'), { recursive: true })
  await mkdir(dashboard, { recursive: true })
  await mkdir(docs, { recursive: true })

  // Landing SVGs (filenames the site already references).
  await writeFile(join(landing, 'favicon.svg'), markColor)
  await writeFile(
    join(landing, 'brand', 'logo-mark.svg'),
    markColor.replace('<svg ', '<svg width="32" height="32" ')
  )
  await writeFile(
    join(landing, 'brand', 'logo-mark-mono.svg'),
    markMono.replace('<svg ', '<svg width="32" height="32" ')
  )
  await writeFile(join(landing, 'brand', 'logo.svg'), lockup(INK))
  await writeFile(join(landing, 'brand', 'logo-dark.svg'), lockup(PAPER))

  // Landing rasters.
  await sharp(await rasterTransparent(16)).toFile(
    join(landing, 'favicon-16.png')
  )
  await sharp(await rasterTransparent(32)).toFile(
    join(landing, 'favicon-32.png')
  )
  await sharp(await rasterOnField(180, 0.16)).toFile(
    join(landing, 'apple-touch-icon.png')
  )
  await sharp(await rasterOnField(192, 0.22)).toFile(
    join(landing, 'icon-192.png')
  )
  await sharp(await rasterOnField(512, 0.22)).toFile(
    join(landing, 'icon-512.png')
  )
  await sharp(await rasterTransparent(256)).toFile(
    join(landing, 'brand', 'logo-mark-256.png')
  )
  await sharp(await rasterTransparent(512)).toFile(
    join(landing, 'brand', 'logo-mark-512.png')
  )
  await sharp(await rasterTransparent(1024)).toFile(
    join(landing, 'brand', 'logo-mark-1024.png')
  )
  await sharp(await buildOg()).toFile(join(landing, 'brand', 'og-brand.png'))
  await writeFile(
    join(landing, 'favicon.ico'),
    buildIco([
      { size: 16, png: await rasterTransparent(16) },
      { size: 32, png: await rasterTransparent(32) },
    ])
  )
  console.log('✓ landing brand kit')

  // Dashboard + docs favicons (own public dirs, separate deploys).
  for (const dir of [dashboard, docs]) {
    await writeFile(join(dir, 'favicon.svg'), markColor)
    await sharp(await rasterTransparent(16)).toFile(join(dir, 'favicon-16.png'))
    await sharp(await rasterTransparent(32)).toFile(join(dir, 'favicon-32.png'))
    await sharp(await rasterOnField(180, 0.16)).toFile(
      join(dir, 'apple-touch-icon.png')
    )
    console.log(`✓ favicons → ${dir}`)
  }
  console.log('done')
}

await run()
