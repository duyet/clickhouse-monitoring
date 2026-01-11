/**
 * Type assertion utility for React 19 compatibility
 * Converts bigint values to strings to satisfy stricter ReactNode types
 */
export const asReactNode = (value: unknown): React.ReactNode => {
  return value as React.ReactNode
}
