/**
 * React 19 compatibility utilities
 *
 * React 19 has stricter type definitions that don't allow bigint in ReactNode.
 * These utilities help handle the compatibility issues.
 */

/**
 * Type guard to check if a value is safe for React 19 ReactNode
 */
export function isSafeReactNode(value: unknown): value is React.ReactNode {
  if (typeof value === 'bigint') {
    return false
  }
  return true
}

/**
 * Convert unsafe values to safe ReactNode values
 */
export function toSafeReactNode(value: unknown): React.ReactNode {
  if (typeof value === 'bigint') {
    return String(value)
  }
  return value as React.ReactNode
}

/**
 * Safe component children renderer
 */
export function renderSafeChildren(children: React.ReactNode): React.ReactNode {
  return children
}
