import React from 'react'

/**
 * React 19 compatibility utilities
 *
 * React 19 excludes BigInt from ReactNode type, so we need to handle it specially
 */

/**
 * Safely convert a value to a ReactNode, handling BigInt conversion
 */
export function toReactNode(value: unknown): React.ReactNode {
  if (typeof value === 'bigint') {
    return String(value)
  }
  return value as React.ReactNode
}

/**
 * Map children and convert BigInt values to strings
 */
export function mapReactChildren(
  children: React.ReactNode,
  mapper: (child: React.ReactNode) => React.ReactNode
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === 'bigint') {
      return String(child)
    }
    return mapper(child)
  })
}

/**
 * Clone element with BigInt-safe children
 */
export function cloneElementWithBigInt(
  element: React.ReactElement,
  props?: React.Attributes,
  ...children: React.ReactNode[]
): React.ReactElement {
  const safeChildren = children.map(toReactNode)
  return React.cloneElement(element, props, ...safeChildren)
}
