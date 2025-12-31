/**
 * URL builder utility for constructing URLs with query parameters.
 *
 * Handles cases where the base URL may already contain query parameters,
 * automatically using the correct separator (`?` or `&`).
 *
 * @example
 * ```ts
 * import { buildUrl } from '@/lib/url/url-builder'
 *
 * // Base URL without query params
 * buildUrl('/overview', { host: 0 })
 * // Returns: '/overview?host=0'
 *
 * // Base URL with existing query params
 * buildUrl('/table?database=default', { host: 1, table: 'users' })
 * // Returns: '/table?database=default&host=1&table=users'
 *
 * // Merge with existing search params
 * buildUrl('/table', { host: 1 }, 'database=default&status=active')
 * // Returns: '/table?host=1&database=default&status=active'
 *
 * // Undefined values are ignored
 * buildUrl('/overview', { host: 0, filter: undefined })
 * // Returns: '/overview?host=0'
 * ```
 *
 * @param baseUrl - The base URL path
 * @param params - Object containing query parameters
 * @param existingSearchParams - Optional existing query params to merge
 * @returns Complete URL with query parameters
 */
export function buildUrl(
  baseUrl: string,
  params: Record<string, string | number | boolean | undefined>,
  existingSearchParams?: URLSearchParams | string
): string {
  const separator = baseUrl.includes('?') ? '&' : '?'
  const searchParams = new URLSearchParams(existingSearchParams)

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.set(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `${baseUrl}${separator}${queryString}` : baseUrl
}

