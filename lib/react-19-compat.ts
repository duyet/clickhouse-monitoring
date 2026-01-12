import React from 'react'

/**
 * React 19 Compatibility Utilities
 *
 * React 19 introduced several breaking type changes:
 * - ReactNode no longer includes bigint
 * - RefObject<T> now requires nullable types: RefObject<T | null>
 * - Custom CSS properties need type casting in inline styles
 *
 * This file provides utility functions to handle these changes gracefully.
 */

/**
 * Converts bigint values to strings for React 19 compatibility
 * React 19's ReactNode type excludes bigint, so this helps with type safety
 *
 * @example
 * toReact19Node(42n) // Returns: "42"
 * toReact19Node("text") // Returns: "text"
 * toReact19Node(123) // Returns: 123
 *
 * @param value - Any value that might be a bigint
 * @returns Value converted to a React-compatible type
 */
export function toReact19Node(
  value: unknown
): string | number | boolean | React.ReactElement | null | undefined {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    React.isValidElement(value) ||
    value === null ||
    value === undefined
  ) {
    return value
  }
  // For arrays and other complex types, convert to string
  return String(value)
}

/**
 * Type guard to check if a value is a valid React node for React 19
 */
export function isValidReact19Node(value: unknown): value is React.ReactNode {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    React.isValidElement(value) ||
    (Array.isArray(value) && value.every(isValidReact19Node))
  )
}

/**
 * Safely converts an array of mixed types to React 19 compatible nodes
 *
 * @example
 * sanitizeReactNodes([1n, "text", 42])
 * // Returns: ["1", "text", 42]
 */
export function sanitizeReactNodes(
  items: unknown[]
): (string | number | boolean | React.ReactElement | null | undefined)[] {
  return items.map(toReact19Node)
}

/**
 * Creates a React 19 compatible ref object with nullable type
 *
 * @example
 * const ref = createRefObject<HTMLDivElement>()
 * // Returns: React.RefObject<HTMLDivElement | null>
 */
export function createRefObject<T>(): React.RefObject<T | null> {
  return React.createRef<T>() as React.RefObject<T | null>
}

/**
 * Helper for casting style objects to `any` for inline styles with custom properties
 * React 19 is stricter about CSS properties in inline styles
 *
 * @example
 * const style = {
 *   '--custom-color': '#ff0000',
 *   backgroundColor: 'var(--custom-color)'
 * } as React.CSSProperties
 *
 * // Use this helper to cast safely
 * const safeStyle = castStylesForReact19(style)
 */
export function castStylesForReact19(styles: React.CSSProperties): any {
  return styles as any
}

/**
 * Converts BigInt values in data objects to strings for safe React rendering
 *
 * @example
 * const data = { count: 42n, name: "test" }
 * const safeData = convertBigIntToStrings(data)
 * // Returns: { count: "42", name: "test" }
 */
export function convertBigIntToStrings<T extends Record<string, unknown>>(
  data: T
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'bigint') {
      result[key] = value.toString()
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'bigint' ? item.toString() : item
      )
    } else {
      result[key] = value
    }
  }
  return result
}

/**
 * Ensures a value is a valid React 19 node, converting if necessary
 *
 * @example
 * ensureReact19Node(42n) // Returns: "42"
 * ensureReact19Node(null) // Returns: null
 * ensureReact19Node(<div>test</div>) // Returns: <div>test</div>
 */
export function ensureReact19Node(value: unknown): React.ReactNode {
  if (isValidReact19Node(value)) {
    return value
  }
  return toReact19Node(value)
}
