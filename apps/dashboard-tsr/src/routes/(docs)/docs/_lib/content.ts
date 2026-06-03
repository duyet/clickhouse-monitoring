/**
 * Loads docs MDX/markdown source files via import.meta.glob.
 *
 * Vite resolves glob paths relative to the source file at build time.
 * The path below navigates from this file up to the repo root's docs/content/.
 *
 * Hierarchy (from this file):
 *   _lib -> docs -> docs -> (docs) -> routes -> src -> dashboard-tsr -> apps -> (repo root) -> docs/content
 *   = 7 levels up  (verified via os.path.relpath)
 *
 * `{ eager: true, query: '?raw', import: 'default' }` gives us the raw file
 * text synchronously — no dynamic import() needed, which is important for SSR
 * and the static prerender pass.
 */
const rawModules = import.meta.glob(
  '../../../../../../../docs/content/**/*.{md,mdx}',
  { eager: true, query: '?raw', import: 'default' }
)

function pathToSlug(path: string): string {
  // path looks like: ../../../../../../../docs/content/advanced/custom-name.mdx
  const contentMarker = '/docs/content/'
  const idx = path.indexOf(contentMarker)
  if (idx === -1) return ''
  const rel = path.slice(idx + contentMarker.length)
  const noExt = rel.replace(/\.(mdx|md)$/, '')
  return noExt === 'index' ? '' : noExt.replace(/\/index$/, '')
}

/**
 * Map of slug -> raw markdown/MDX source text.
 *
 * Keys match those produced by the Next app's build-docs-content.ts script.
 * Empty string key = index / introduction page.
 */
export const docsContent: Record<string, string> = Object.fromEntries(
  Object.entries(rawModules).map(([path, source]) => [
    pathToSlug(path),
    source as string,
  ])
)
