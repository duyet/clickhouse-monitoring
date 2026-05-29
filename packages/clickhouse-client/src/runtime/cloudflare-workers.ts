/**
 * Detect Cloudflare Workers without importing server-only ClickHouse clients.
 */
export function isCloudflareWorkers(): boolean {
  if (
    typeof process !== 'undefined' &&
    (process.env.CF_PAGES || process.env.CLOUDFLARE_WORKERS === '1')
  ) {
    return true
  }

  return (
    (typeof caches !== 'undefined' ||
      typeof (globalThis as any).WebSocketPair !== 'undefined' ||
      typeof (globalThis as any).DurableObject !== 'undefined') &&
    typeof process === 'undefined'
  )
}
