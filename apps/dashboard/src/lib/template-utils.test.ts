import { describe, it, expect } from 'bun:test'
import React from 'react'
import {
  replaceTemplateVariables,
  replaceTemplateInReactNode,
} from './template-utils'

describe('replaceTemplateVariables', () => {
  it('replaces a single placeholder', () => {
    expect(
      replaceTemplateVariables('/table?name=[table]', { table: 'users' })
    ).toBe('/table?name=users')
  })

  it('replaces multiple placeholders', () => {
    expect(
      replaceTemplateVariables('/table?database=[database]&table=[table]', {
        database: 'default',
        table: 'users',
      })
    ).toBe('/table?database=default&table=users')
  })

  it('replaces the same placeholder appearing more than once', () => {
    expect(replaceTemplateVariables('[x] and [x]', { x: 'hello' })).toBe(
      'hello and hello'
    )
  })

  it('returns the template unchanged when there are no placeholders', () => {
    expect(replaceTemplateVariables('/static/path', {})).toBe('/static/path')
  })

  it('replaces missing key with empty string', () => {
    expect(replaceTemplateVariables('/table?name=[missing]', {})).toBe(
      '/table?name='
    )
  })

  it('replaces null value with empty string', () => {
    expect(replaceTemplateVariables('[col]', { col: null })).toBe('')
  })

  it('replaces undefined value with empty string', () => {
    expect(replaceTemplateVariables('[col]', { col: undefined })).toBe('')
  })

  it('coerces numeric value to string', () => {
    expect(replaceTemplateVariables('[count]', { count: 42 })).toBe('42')
  })

  it('coerces boolean value to string', () => {
    expect(replaceTemplateVariables('[flag]', { flag: true })).toBe('true')
  })

  it('trims whitespace inside brackets', () => {
    // The implementation does key.trim(), so "[ key ]" resolves "key"
    expect(replaceTemplateVariables('[ key ]', { key: 'trimmed' })).toBe(
      'trimmed'
    )
  })

  it('returns empty string for a template that is only a placeholder with no matching key', () => {
    expect(replaceTemplateVariables('[gone]', {})).toBe('')
  })

  it('handles an empty template string', () => {
    expect(replaceTemplateVariables('', { x: '1' })).toBe('')
  })

  it('documents actual behavior for nested brackets [[x]]', () => {
    // The regex /\[(.*?)\]/g on "[[x]]" matches "[x]" (innermost), replaces with "v",
    // then String.replace replaces that occurrence → actual output is "]" due to
    // the outer "[" remaining and the trailing "]". Document the real value.
    const result = replaceTemplateVariables('[[x]]', { x: 'v' })
    expect(result).toBe(']')
  })
})

describe('replaceTemplateInReactNode', () => {
  it('replaces placeholders in a plain string', () => {
    expect(replaceTemplateInReactNode('Value: [count]', { count: 42 })).toBe(
      'Value: 42'
    )
  })

  it('returns the string unchanged when no placeholders present', () => {
    expect(replaceTemplateInReactNode('no placeholders', {})).toBe(
      'no placeholders'
    )
  })

  it('replaces missing key with empty string in a string node', () => {
    expect(replaceTemplateInReactNode('key=[missing]', {})).toBe('key=')
  })

  it('handles a React element with a string child', () => {
    const el = React.createElement('span', null, 'db=[database]')
    const result = replaceTemplateInReactNode(el, { database: 'default' })
    // React.Children.map wraps the single element in an array
    expect(Array.isArray(result)).toBe(true)
    const arr = result as React.ReactNode[]
    expect(arr).toHaveLength(1)
    const cloned = arr[0] as React.ReactElement<{ children: string }>
    expect(cloned.props.children).toBe('db=default')
  })

  it('handles an array of React nodes containing strings', () => {
    const nodes: React.ReactNode[] = ['Hello [name]', ' world']
    const result = replaceTemplateInReactNode(
      nodes as unknown as React.ReactNode,
      {
        name: 'Alice',
      }
    )
    const arr = result as React.ReactNode[]
    expect(arr[0]).toBe('Hello Alice')
    expect(arr[1]).toBe(' world')
  })

  it('passes through non-string, non-element children as-is', () => {
    // Numbers are valid React children but not strings; they pass through untouched.
    const nodes: React.ReactNode[] = [42 as unknown as React.ReactNode]
    const result = replaceTemplateInReactNode(
      nodes as unknown as React.ReactNode,
      { x: '1' }
    )
    const arr = result as React.ReactNode[]
    expect(arr[0]).toBe(42)
  })
})
