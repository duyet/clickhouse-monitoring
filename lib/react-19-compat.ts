import React from 'react'

/**
 * Convert ReactNode to a valid React 19 compatible type by removing bigint
 * React 19's ReactNode no longer includes bigint
 */
export function toReact19Node(
  value: unknown
): React.ReactElement | string | number | boolean | null | undefined {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null ||
    value === undefined
  ) {
    return value
  }
  if (React.isValidElement(value)) {
    return value
  }
  if (Array.isArray(value)) {
    return value.map(toReact19Node) as unknown as React.ReactElement
  }
  // For any other type, including ReactPortal, convert to string
  return String(value)
}
