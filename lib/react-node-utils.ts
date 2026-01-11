/**
 * Type assertion utility for React 19 compatibility
 * Converts bigint values to strings to satisfy stricter ReactNode types
 */
export const asReactNode = (value: unknown): React.ReactNode => {
  // React 19 has stricter ReactNode types that don't include bigint
  // We need to explicitly convert bigint to string
  if (typeof value === 'bigint') {
    return String(value)
  }

  // For other values, we need to ensure they're valid ReactNode
  if (value === null) {
    return null
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    return String(value)
  }

  return value as React.ReactNode
}
