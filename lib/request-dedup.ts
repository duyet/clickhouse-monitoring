/**
 * Request deduplication utility
 * Prevents duplicate queries from executing simultaneously
 * If the same query is requested multiple times concurrently, only one executes
 */

type PendingRequest<T> = {
  promise: Promise<T>
  timestamp: number
}

// Store pending requests by key
const pendingRequests = new Map<string, PendingRequest<any>>()

// Cleanup interval: remove stale entries every 30 seconds
const CLEANUP_INTERVAL = 30000
// Consider a request stale if it's been pending for more than 2 minutes
const STALE_THRESHOLD = 120000

// Periodic cleanup
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    const keysToDelete: string[] = []

    pendingRequests.forEach((request, key) => {
      if (now - request.timestamp > STALE_THRESHOLD) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => pendingRequests.delete(key))

    if (keysToDelete.length > 0) {
      console.debug(`[Dedup] Cleaned up ${keysToDelete.length} stale requests`)
    }
  }, CLEANUP_INTERVAL)
}

/**
 * Generate a unique key for a request
 * @param params - Request parameters
 * @returns Unique key string
 */
function generateRequestKey(params: Record<string, any>): string {
  // Sort keys for consistent hashing
  const sorted = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key]
      return acc
    }, {} as Record<string, any>)

  return JSON.stringify(sorted)
}

/**
 * Deduplicate concurrent requests
 * If the same request is already in flight, return the existing promise
 * Otherwise, execute the request and cache the promise
 *
 * @param key - Unique key for this request
 * @param executor - Function that executes the request
 * @returns Promise with the request result
 *
 * @example
 * const data = await deduplicate('my-query', () => fetchData({ query: 'SELECT 1' }))
 */
export async function deduplicate<T>(
  key: string,
  executor: () => Promise<T>
): Promise<T> {
  // Check if request is already pending
  const existing = pendingRequests.get(key)

  if (existing) {
    console.debug(`[Dedup] Reusing in-flight request: ${key}`)
    return existing.promise
  }

  console.debug(`[Dedup] Starting new request: ${key}`)

  // Create new request
  const promise = executor()
    .then(result => {
      // Remove from pending once completed
      pendingRequests.delete(key)
      return result
    })
    .catch(error => {
      // Remove from pending on error too
      pendingRequests.delete(key)
      throw error
    })

  // Store pending request
  pendingRequests.set(key, {
    promise,
    timestamp: Date.now(),
  })

  return promise
}

/**
 * Deduplicate a request using auto-generated key
 * Automatically generates a key from the parameters
 *
 * @param params - Request parameters (must be JSON-serializable)
 * @param executor - Function that executes the request
 * @returns Promise with the request result
 *
 * @example
 * const data = await deduplicateByParams(
 *   { query: 'SELECT 1', hostId: 0 },
 *   () => fetchData({ query: 'SELECT 1', hostId: 0 })
 * )
 */
export async function deduplicateByParams<T>(
  params: Record<string, any>,
  executor: () => Promise<T>
): Promise<T> {
  const key = generateRequestKey(params)
  return deduplicate(key, executor)
}

/**
 * Get current deduplication statistics
 * Useful for monitoring and debugging
 */
export function getDedupStats() {
  return {
    pending: pendingRequests.size,
    oldestTimestamp: Array.from(pendingRequests.values()).reduce(
      (min, req) => Math.min(min, req.timestamp),
      Date.now()
    ),
  }
}

/**
 * Clear all pending requests
 * Useful for testing
 */
export function clearDedupCache() {
  pendingRequests.clear()
}
