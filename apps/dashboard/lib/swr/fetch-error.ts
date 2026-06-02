/**
 * Shared fetch error handling for SWR hooks.
 *
 * All SWR fetchers parse non-OK responses the same way:
 * read the JSON body, extract `error.message / type / details`,
 * and throw an Error with those properties attached.
 *
 * This module centralises that logic so each hook doesn't repeat it.
 */

/** Shape of the JSON body returned by API error responses */
interface ApiErrorBody {
  error?: {
    message?: string
    type?: string
    details?: { missingTables?: readonly string[]; [key: string]: unknown }
  }
}

/** Error with optional metadata attached by `throwIfNotOk` */
export interface FetchError extends Error {
  status?: number
  type?: string
  details?: { missingTables?: readonly string[]; [key: string]: unknown }
}

/**
 * Inspect a `Response` and throw a richly-annotated `FetchError` when the
 * status code indicates failure.
 *
 * Does nothing when `response.ok` is true.
 *
 * @param response       - The fetch `Response` to check
 * @param fallbackMessage - Message used when the body contains no error detail
 */
export async function throwIfNotOk(
  response: Response,
  fallbackMessage = 'Request failed'
): Promise<void> {
  if (response.ok) return

  const errorData = (await response.json().catch(() => ({}))) as ApiErrorBody

  const error = new Error(
    errorData.error?.message || `${fallbackMessage}: ${response.statusText}`
  ) as FetchError

  error.status = response.status

  if (errorData.error) {
    error.type = errorData.error.type
    error.details = errorData.error.details
  }

  throw error
}
