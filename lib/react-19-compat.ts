/**
 * React 19 compatibility utilities
 *
 * This module provides helpers to handle React 19's stricter type system
 * where bigint is excluded from ReactNode.
 */

/**
 * Helper to convert potentially problematic values (like bigint) to React 19 compatible nodes
 */
export function toReact19Node(value: unknown): React.ReactNode {
  if (typeof value === 'bigint') {
    return String(value)
  }
  if (value === null || value === undefined) {
    return null
  }
  return value as React.ReactNode
}
