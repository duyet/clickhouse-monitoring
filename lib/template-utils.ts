import React from 'react'

/**
 * Converts bigint values to strings for React 19 compatibility
 * React 19's ReactNode type excludes bigint, so this helps with type safety
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
  // For other types, convert to string
  return String(value)
}

/**
 * Template variable replacement utilities
 *
 * These functions replace [key] placeholders in templates with values from data objects.
 * Used for dynamic URL generation and content rendering in data tables.
 */

/**
 * Replace [key] placeholders in a template string with values from data object
 *
 * @example
 * replaceTemplateVariables('/table?database=[database]&table=[table]', { database: 'default', table: 'users' })
 * // Returns: '/table?database=default&table=users'
 *
 * @param template - String containing [key] placeholders
 * @param data - Object with key-value pairs for replacement
 * @returns String with placeholders replaced by values
 */
export function replaceTemplateVariables(
  template: string,
  data: Record<string, unknown>
): string {
  const matches = template.match(/\[(.*?)\]/g)
  if (!matches) return template

  let result = template
  for (const match of matches) {
    const key = match.slice(1, -1).trim()
    const value = data[key]
    result = result.replace(match, value != null ? String(value) : '')
  }
  return result
}

/**
 * Replace [key] placeholders in React nodes recursively
 *
 * Handles both string content and nested React elements.
 * Useful for hover card content that may contain React components.
 * Handles BigInt values by converting them to strings for React 19 compatibility.
 *
 * @example
 * replaceTemplateInReactNode('Value: [count]', { count: 42 })
 * // Returns: 'Value: 42'
 *
 * @param content - String or React node containing [key] placeholders
 * @param data - Object with key-value pairs for replacement
 * @returns Content with placeholders replaced by values
 */
export function replaceTemplateInReactNode(
  content: string | React.ReactNode,
  data: Record<string, unknown>
): string | React.ReactNode {
  // Helper to convert any value to a React-compatible string
  const convertValueToString = (value: unknown): string => {
    if (typeof value === 'bigint') {
      return value.toString()
    }
    return String(value)
  }

  if (typeof content === 'string') {
    const matches = content.match(/\[(.*?)\]/g)
    if (!matches) return content

    let result = content
    for (const match of matches) {
      const key = match.slice(1, -1).trim()
      const value = data[key]
      result = result.replace(
        match,
        value != null ? convertValueToString(value) : ''
      )
    }
    return result
  }

  return React.Children.map(content, (child) => {
    if (typeof child === 'string') {
      const matches = child.match(/\[(.*?)\]/g)
      if (!matches) return child

      let result = child
      for (const match of matches) {
        const key = match.slice(1, -1).trim()
        const value = data[key]
        result = result.replace(
          match,
          value != null ? convertValueToString(value) : ''
        )
      }
      return result
    }

    if (React.isValidElement(child)) {
      const childElement = child as React.ReactElement<{
        children?: React.ReactNode
      }>
      return React.cloneElement(
        child,
        {},
        replaceTemplateInReactNode(childElement.props.children, data)
      )
    }

    return child
  })
}
