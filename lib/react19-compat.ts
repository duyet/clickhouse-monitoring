/**
 * React 19 compatibility utilities
 *
 * React 19 has stricter type definitions for ReactNode, particularly around bigint values.
 */

import React from 'react'

/**
 * Safely convert a value to a ReactNode compatible type for React 19
 * Filters out bigint values which are not valid ReactNode in React 19
 */
export function toReactNode(value: unknown): React.ReactNode {
  if (typeof value === 'bigint') {
    return String(value) as unknown as React.ReactNode
  }

  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === 'object') {
    // Check if it's a React element
    if (React.isValidElement(value)) {
      return value
    }

    // For objects, filter out any bigint properties
    if (Array.isArray(value)) {
      // Ensure we return a valid ReactNode array
      const mapped = value
        .map(toReactNode)
        .filter((child) => child !== null && child !== undefined)
      return (mapped.length > 0 ? mapped : null) as React.ReactNode
    }

    const filteredObj: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      const safeVal = toReactNode(val)
      if (safeVal !== null && safeVal !== undefined) {
        filteredObj[key] = safeVal
      }
    }
    return (
      Object.keys(filteredObj).length > 0 ? filteredObj : null
    ) as React.ReactNode
  }

  return value as React.ReactNode
}

/**
 * React 19 compatible children mapper that filters out bigint values
 */
export function safeReactChildren(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    return toReactNode(child)
  })
}
