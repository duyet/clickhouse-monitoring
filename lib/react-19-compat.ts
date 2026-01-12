import type React from 'react'

/**
 * Converts a value to a React 19 compatible ReactNode
 * React 19's ReactNode type excludes bigint, but Radix UI components
 * and data sources can produce bigint values
 */
export function toReact19Node(value: unknown): React.ReactNode {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  return value as React.ReactNode
}

/**
 * Type assertion helper for React 19 compatibility
 * Casts a value to React.ReactNode when we know it's safe
 */
export function asReact19Node<T>(value: T): React.ReactNode {
  return toReact19Node(value)
}
