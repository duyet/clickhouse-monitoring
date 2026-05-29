import {
  replaceTemplateInReactNode,
  replaceTemplateVariables,
} from '../template-utils'
import { describe, expect, it } from 'bun:test'
import React from 'react'

describe('replaceTemplateInReactNode', () => {
  it('replaces placeholders in plain strings', () => {
    expect(replaceTemplateInReactNode('hello [name]', { name: 'world' })).toBe(
      'hello world'
    )
  })

  it('returns string unchanged when no placeholders', () => {
    expect(replaceTemplateInReactNode('no placeholders', {})).toBe(
      'no placeholders'
    )
  })

  it('replaces placeholders inside React elements', () => {
    const element = React.createElement('span', null, 'Value: [count]')
    const result = replaceTemplateInReactNode(element, { count: '42' })
    // React.Children.map returns an array
    expect(Array.isArray(result)).toBe(true)
    const mappedElement = (result as React.ReactElement[])[0]
    expect(React.isValidElement(mappedElement)).toBe(true)
    // The child text should have the placeholder replaced
    const child = mappedElement.props.children
    expect(child).toBe('Value: 42')
  })

  it('handles nested React elements with placeholders', () => {
    const inner = React.createElement('strong', null, '[bold]')
    const outer = React.createElement('div', null, inner)
    const result = replaceTemplateInReactNode(outer, { bold: 'replaced' })
    expect(Array.isArray(result)).toBe(true)
    const mappedOuter = (result as React.ReactElement[])[0]
    expect(React.isValidElement(mappedOuter)).toBe(true)
    // React.Children.map returns an array for the inner children too
    const innerChildren = mappedOuter.props.children as React.ReactElement[]
    expect(Array.isArray(innerChildren)).toBe(true)
    const innerResult = innerChildren[0]
    expect(React.isValidElement(innerResult)).toBe(true)
    expect((innerResult as React.ReactElement).props.children).toBe('replaced')
  })

  it('handles mixed string and element children', () => {
    const element = React.createElement(
      'div',
      null,
      'Name: [name]',
      React.createElement('span', null, '!')
    )
    const result = replaceTemplateInReactNode(element, { name: 'test' })
    expect(Array.isArray(result)).toBe(true)
    const mappedElement = (result as React.ReactElement[])[0]
    const children = mappedElement.props.children as unknown[]
    expect(children[0]).toBe('Name: test')
    expect(React.isValidElement(children[1])).toBe(true)
  })

  it('passes through non-string, non-element children unchanged', () => {
    const element = React.createElement('div', null, 42, null)
    const result = replaceTemplateInReactNode(element, {})
    expect(Array.isArray(result)).toBe(true)
    const mappedElement = (result as React.ReactElement[])[0]
    const children = mappedElement.props.children as unknown[]
    // React filters out null children, so we only get [42]
    expect(children[0]).toBe(42)
    expect(children.length).toBe(1)
  })

  it('handles null content by returning null', () => {
    const result = replaceTemplateInReactNode(null as unknown as string, {})
    expect(result).toBeNull()
  })

  it('handles undefined content', () => {
    const result = replaceTemplateInReactNode(
      undefined as unknown as string,
      {}
    )
    expect(result).toBeUndefined()
  })
})

describe('replaceTemplateVariables', () => {
  it('returns the template unchanged when no placeholders are present', () => {
    expect(replaceTemplateVariables('/static/path', { foo: 'bar' })).toBe(
      '/static/path'
    )
  })

  it('replaces a single placeholder with the matching value', () => {
    expect(replaceTemplateVariables('/db/[name]', { name: 'analytics' })).toBe(
      '/db/analytics'
    )
  })

  it('replaces multiple placeholders in one template', () => {
    expect(
      replaceTemplateVariables('/table?database=[database]&table=[table]', {
        database: 'default',
        table: 'users',
      })
    ).toBe('/table?database=default&table=users')
  })

  it('replaces missing keys with an empty string', () => {
    expect(replaceTemplateVariables('hello [name]', {})).toBe('hello ')
  })

  it('treats null and undefined values as empty strings', () => {
    expect(
      replaceTemplateVariables('a=[a],b=[b]', { a: null, b: undefined })
    ).toBe('a=,b=')
  })

  it('coerces non-string values via String()', () => {
    expect(
      replaceTemplateVariables('count=[n], on=[ok]', { n: 42, ok: true })
    ).toBe('count=42, on=true')
  })

  it('trims whitespace inside placeholders before lookup', () => {
    expect(
      replaceTemplateVariables('hello [  name  ]', { name: 'world' })
    ).toBe('hello world')
  })

  it('replaces every occurrence of a repeated placeholder', () => {
    expect(replaceTemplateVariables('[x] then [x]', { x: 'one' })).toBe(
      'one then one'
    )
  })
})
