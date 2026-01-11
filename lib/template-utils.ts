import React from 'react'

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
  if (typeof content === 'string') {
    return replaceTemplateVariables(content, data)
  }

  return React.Children.map(content, (child) => {
    if (typeof child === 'string') {
      return replaceTemplateVariables(child, data)
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

    // Ensure we only return valid React node types
    if (child == null || typeof child === 'object') {
      return child
    }

    // Convert primitive types to strings (including bigint, number, boolean)
    return String(child)
  })
}

/**
 * Helper to convert potentially problematic values (like bigint) to React 19 compatible nodes
 * This is needed because React 19's ReactNode type excludes bigint
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
