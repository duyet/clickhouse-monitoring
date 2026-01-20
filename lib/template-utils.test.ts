import { describe, expect, it } from 'bun:test'
import React from 'react'

import {
  replaceTemplateInReactNode,
  replaceTemplateVariables,
} from './template-utils'

describe('template-utils', () => {
  describe('replaceTemplateVariables', () => {
    it('should replace single placeholder', () => {
      const template = 'Value: [count]'
      const data = { count: 42 }
      const result = replaceTemplateVariables(template, data)

      expect(result).toBe('Value: 42')
    })

    it('should replace multiple placeholders', () => {
      const template = '/table?database=[db]&table=[tbl]'
      const data = { db: 'default', tbl: 'users' }
      const result = replaceTemplateVariables(template, data)

      expect(result).toBe('/table?database=default&table=users')
    })

    it('should handle repeated placeholders', () => {
      const template = '[x] + [x] = [result]'
      const data = { x: '5', result: '10' }
      const result = replaceTemplateVariables(template, data)

      expect(result).toBe('5 + 5 = 10')
    })

    it('should replace with string values', () => {
      const template = 'Hello [name]'
      const data = { name: 'World' }
      const result = replaceTemplateVariables(template, data)

      expect(result).toBe('Hello World')
    })

    it('should replace with number values', () => {
      const template = 'Count: [num]'
      const data = { num: 123.45 }
      const result = replaceTemplateVariables(template, data)

      expect(result).toBe('Count: 123.45')
    })

    it('should replace with boolean values', () => {
      const template = 'Active: [status]'
      const data = { status: true }
      const result = replaceTemplateVariables(template, data)

      expect(result).toBe('Active: true')
    })

    it('should replace with null as empty string', () => {
      const template = 'Value: [value]'
      const data = { value: null }
      const result = replaceTemplateVariables(template, data)

      expect(result).toBe('Value: ')
    })

    it('should replace with undefined as empty string', () => {
      const template = 'Value: [value]'
      const data = { value: undefined }
      const result = replaceTemplateVariables(template, data)

      expect(result).toBe('Value: ')
    })

    it('should return template unchanged when no placeholders found', () => {
      const template = 'Hello World'
      const data = { name: 'Test' }
      const result = replaceTemplateVariables(template, data)

      expect(result).toBe('Hello World')
    })

    it('should handle empty template string', () => {
      const template = ''
      const data = { key: 'value' }
      const result = replaceTemplateVariables(template, data)

      expect(result).toBe('')
    })

    it('should handle empty data object', () => {
      const template = 'Value: [key]'
      const data = {}
      const result = replaceTemplateVariables(template, data)

      expect(result).toBe('Value: ')
    })

    it('should trim whitespace from key names', () => {
      const template = 'Value: [ key ]'
      const data = { key: 'trimmed' }
      const result = replaceTemplateVariables(template, data)

      expect(result).toBe('Value: trimmed')
    })

    it('should handle keys with spaces', () => {
      const template = '[first name] [last name]'
      const data = { 'first name': 'John', 'last name': 'Doe' }
      const result = replaceTemplateVariables(template, data)

      expect(result).toBe('John Doe')
    })

    it('should handle special characters in keys', () => {
      const template = 'Value: [key-with_underscore]'
      const data = { 'key-with_underscore': 'test' }
      const result = replaceTemplateVariables(template, data)

      expect(result).toBe('Value: test')
    })

    it('should handle adjacent placeholders', () => {
      const template = '[a][b][c]'
      const data = { a: '1', b: '2', c: '3' }
      const result = replaceTemplateVariables(template, data)

      expect(result).toBe('123')
    })

    it('should handle nested brackets', () => {
      const template = '[[value]]'
      const data = { value: 'test' }
      const result = replaceTemplateVariables(template, data)

      // Note: Only replaces [value], outer brackets remain
      expect(result).toBe('[test]')
    })

    it('should handle square brackets without keys', () => {
      const template = 'Value: []'
      const data = { key: 'value' }
      const result = replaceTemplateVariables(template, data)

      expect(result).toBe('Value: ')
    })

    it('should handle zero value', () => {
      const template = 'Count: [count]'
      const data = { count: 0 }
      const result = replaceTemplateVariables(template, data)

      expect(result).toBe('Count: 0')
    })

    it('should handle empty string value', () => {
      const template = 'Value: [value]'
      const data = { value: '' }
      const result = replaceTemplateVariables(template, data)

      expect(result).toBe('Value: ')
    })

    it('should handle URL-like templates', () => {
      const template = 'https://example.com/[path]?query=[param]'
      const data = { path: 'api/v1', param: 'test' }
      const result = replaceTemplateVariables(template, data)

      expect(result).toBe('https://example.com/api/v1?query=test')
    })

    it('should handle complex data structure', () => {
      const template = 'User: [name], Age: [age], Active: [active]'
      const data = {
        name: 'Alice',
        age: 30,
        active: false,
        extra: 'ignored',
      }
      const result = replaceTemplateVariables(template, data)

      expect(result).toBe('User: Alice, Age: 30, Active: false')
    })
  })

  describe('replaceTemplateInReactNode', () => {
    it('should replace placeholders in string content', () => {
      const content = 'Value: [count]'
      const data = { count: 42 }
      const result = replaceTemplateInReactNode(content, data)

      expect(result).toBe('Value: 42')
    })

    it('should return string unchanged when no placeholders', () => {
      const content = 'Hello World'
      const data = { key: 'value' }
      const result = replaceTemplateInReactNode(content, data)

      expect(result).toBe('Hello World')
    })

    it('should handle empty string content', () => {
      const content = ''
      const data = { key: 'value' }
      const result = replaceTemplateInReactNode(content, data)

      expect(result).toBe('')
    })

    it('should replace placeholders in React element children', () => {
      const content = React.createElement('div', null, 'Value: [count]')
      const data = { count: 42 }
      const result = replaceTemplateInReactNode(content, data)

      expect(result).toEqual(
        React.createElement('div', null, 'Value: 42')
      )
    })

    it('should replace placeholders in nested React elements', () => {
      const content = React.createElement(
        'div',
        null,
        React.createElement('span', null, 'Value: [count]')
      )
      const data = { count: 42 }
      const result = replaceTemplateInReactNode(content, data)

      const expected = React.createElement(
        'div',
        null,
        React.createElement('span', null, 'Value: 42')
      )
      expect(result).toEqual(expected)
    })

    it('should handle React elements with multiple children', () => {
      const content = React.createElement(
        'div',
        null,
        'Value: ',
        '[count]',
        ' units'
      )
      const data = { count: 42 }
      const result = replaceTemplateInReactNode(content, data)

      const expected = React.createElement('div', null, 'Value: 42 units')
      expect(result).toEqual(expected)
    })

    it('should replace placeholders in complex React structure', () => {
      const content = React.createElement(
        'div',
        null,
        React.createElement('span', null, 'Name: [name]'),
        React.createElement('span', null, 'Age: [age]')
      )
      const data = { name: 'Alice', age: 30 }
      const result = replaceTemplateInReactNode(content, data)

      const expected = React.createElement(
        'div',
        null,
        React.createElement('span', null, 'Name: Alice'),
        React.createElement('span', null, 'Age: 30')
      )
      expect(result).toEqual(expected)
    })

    it('should handle empty data object', () => {
      const content = 'Value: [key]'
      const data = {}
      const result = replaceTemplateInReactNode(content, data)

      expect(result).toBe('Value: ')
    })

    it('should handle React element with no children', () => {
      const content = React.createElement('div')
      const data = { key: 'value' }
      const result = replaceTemplateInReactNode(content, data)

      expect(result).toEqual(React.createElement('div'))
    })

    it('should preserve React element props', () => {
      const content = React.createElement('div', { className: 'test' }, '[value]')
      const data = { value: '42' }
      const result = replaceTemplateInReactNode(content, data)

      expect(result).toEqual(
        React.createElement('div', { className: 'test' }, '42')
      )
    })

    it('should handle multiple placeholders in single string child', () => {
      const content = '[first] [second] [third]'
      const data = { first: 'A', second: 'B', third: 'C' }
      const result = replaceTemplateInReactNode(content, data)

      expect(result).toBe('A B C')
    })

    it('should handle deeply nested React elements', () => {
      const content = React.createElement(
        'div',
        null,
        React.createElement(
          'span',
          null,
          React.createElement('strong', null, '[value]')
        )
      )
      const data = { value: 'test' }
      const result = replaceTemplateInReactNode(content, data)

    it('should handle errors in React element processing gracefully', () => {
      const content = React.createElement(
        'div',
        null,
        React.createElement('span', { 'data-bad': null as any }, '[value]')
      )
      const data = { value: '42' }
      // Should not throw, catch block handles errors
      const result = replaceTemplateInReactNode(content, data)
      expect(result).toBeTruthy()
    })

      const expected = React.createElement(
        'div',
        null,
        React.createElement(
          'span',
          null,
          React.createElement('strong', null, 'test')
        )
      )
      expect(result).toEqual(expected)
    })

    it('should handle React fragments', () => {
      const content = React.createElement(
        React.Fragment,
        null,
        React.createElement('span', null, 'Value: [count]')
      )
      const data = { count: 42 }
      const result = replaceTemplateInReactNode(content, data)

      const expected = React.createElement(
        React.Fragment,
        null,
        React.createElement('span', null, 'Value: 42')
      )
      expect(result).toEqual(expected)
    })
  })
})
