/**
 * Debounce Hooks
 *
 * Provides reusable debouncing utilities for optimizing performance
 * in scenarios like search inputs, filter handlers, and API requests.
 */

import { useEffect, useState } from 'react'

/**
 * Debounce delay presets for common scenarios
 */
export const DEBOUNCE_DELAY = {
  /** Fast: 150ms - For lightweight operations (UI updates, local filtering) */
  FAST: 150,
  /** Default: 300ms - For typical user input (search, forms) */
  DEFAULT: 300,
  /** Slow: 500ms - For expensive operations (API calls, heavy computation) */
  SLOW: 500,
} as const

/**
 * Hook to debounce a value
 *
 * Delays updating the returned value until after a specified delay
 * has passed since the last value change.
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearch = useDebounce(searchTerm, 300)
 *
 * // debouncedSearch updates 300ms after searchTerm stops changing
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     performSearch(debouncedSearch)
 *   }
 * }, [debouncedSearch])
 * ```
 */
export function useDebounce<T>(
  value: T,
  delay: number = DEBOUNCE_DELAY.DEFAULT
): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    // Set up timeout to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clean up timeout if value changes before delay expires
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook to debounce a callback function
 *
 * Returns a debounced version of the callback that only executes
 * after the specified delay has passed since the last invocation.
 *
 * @example
 * ```tsx
 * const debouncedSearch = useDebouncedCallback(
 *   (query: string) => performSearch(query),
 *   300,
 *   [query]
 * )
 *
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = DEBOUNCE_DELAY.DEFAULT,
  deps: React.DependencyList = []
): T {
  const [debouncedCall, setDebouncedCall] = useState<ReturnType<
    typeof setTimeout
  > | null>(null)

  useEffect(() => {
    // Clean up any pending debounced call on unmount or dependency change
    return () => {
      if (debouncedCall) {
        clearTimeout(debouncedCall)
      }
    }
  }, [debouncedCall, ...deps])

  return ((...args: Parameters<T>) => {
    // Clear any pending call
    if (debouncedCall) {
      clearTimeout(debouncedCall)
    }

    // Schedule new call after delay
    const newCall = setTimeout(() => {
      callback(...args)
    }, delay)

    setDebouncedCall(newCall)
  }) as T
}

/**
 * Hook to debounce and track loading state
 *
 * Similar to useDebounce but also tracks whether a debounced update is pending.
 * Useful for showing loading indicators during debounced operations.
 *
 * @example
 * ```tsx
 * const [input, setInput] = useState('')
 * const { debouncedValue, isPending } = useDebounceWithPending(input, 300)
 *
 * return (
 *   <div>
 *     <input onChange={(e) => setInput(e.target.value)} />
 *     {isPending && <Spinner />}
 *     {debouncedValue && <Results query={debouncedValue} />}
 *   </div>
 * )
 * ```
 */
export function useDebounceWithPending<T>(
  value: T,
  delay: number = DEBOUNCE_DELAY.DEFAULT
): { debouncedValue: T; isPending: boolean } {
  const [debouncedValue, setDebouncedValue] = useState(value)

  // Derive isPending from whether value differs from debouncedValue
  // This avoids separate state updates that could cause extra renders
  const isPending = value !== debouncedValue

  useEffect(() => {
    // Only set up timeout if value differs from current debounced value
    if (value === debouncedValue) {
      return
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay, debouncedValue])

  return { debouncedValue, isPending }
}
