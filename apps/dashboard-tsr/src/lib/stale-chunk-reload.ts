/**
 * Recover from stale dynamic-import failures after a deploy.
 *
 * This is a static SPA: each build content-hashes its chunks
 * (`mutation-progress-<hash>.js`). When a new version deploys, the old hashes
 * are gone. A tab opened BEFORE the deploy still holds the old asset manifest,
 * so the first lazy `import()` after the deploy requests a chunk that no longer
 * exists. On Cloudflare the missing asset falls through to the SPA router and
 * resolves to an HTML 404, so the browser throws:
 *
 *   "Failed to fetch dynamically imported module: …/assets/mutation-progress-…js"
 *
 * Vite fires a cancelable `vite:preloadError` for exactly this case. We reload
 * once to pull the fresh `index.html` + current chunk hashes. A short
 * sessionStorage timestamp guards against reload loops if the chunk is genuinely
 * unrecoverable (e.g. mid-deploy skew) — at most one reload per 10s window.
 */

const RELOAD_TS_KEY = 'chm:stale-chunk-reload-ts'
const RELOAD_WINDOW_MS = 10_000

let registered = false

function reloadOnce(): void {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_TS_KEY) || 0)
    if (Date.now() - last < RELOAD_WINDOW_MS) return // already reloaded recently
    sessionStorage.setItem(RELOAD_TS_KEY, String(Date.now()))
  } catch {
    // sessionStorage unavailable (private mode / blocked) — reload anyway.
  }
  window.location.reload()
}

function isDynamicImportError(reason: unknown): boolean {
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === 'string'
        ? reason
        : ''
  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message)
  )
}

/**
 * Register the stale-chunk recovery listeners. Client-only and idempotent, so it
 * is safe to call from the shared router factory (which also runs on the server).
 */
export function registerStaleChunkReload(): void {
  if (registered || typeof window === 'undefined') return
  registered = true

  // Vite's preload helper fires this (cancelable) when a chunk fetch fails.
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()
    reloadOnce()
  })

  // Belt-and-suspenders: some failures surface as an unhandled rejection
  // (e.g. a lazy route import not routed through the preload helper).
  window.addEventListener('unhandledrejection', (event) => {
    if (isDynamicImportError(event.reason)) {
      event.preventDefault()
      reloadOnce()
    }
  })
}
