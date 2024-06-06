import { expect, jest } from '@jest/globals'

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { cn, dedent, getHost, uniq } from './utils'

jest.mock('clsx', () => ({
  clsx: jest.fn(),
}))

jest.mock('tailwind-merge', () => ({
  twMerge: jest.fn(),
}))

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names using clsx and twMerge', () => {
      const mockInputs = ['class1', 'class2']
      ;(clsx as jest.Mock).mockReturnValue('merged-class')
      ;(twMerge as jest.Mock).mockReturnValue('tw-merged-class')

      const result = cn(...mockInputs)

      expect(clsx).toHaveBeenCalledWith(mockInputs)
      expect(twMerge).toHaveBeenCalledWith('merged-class')
      expect(result).toBe('tw-merged-class')
    })
  })

  describe('uniq', () => {
    it('should remove duplicate items from an array', () => {
      const input = [1, 2, 2, 3, 4, 4, 5]
      const expectedOutput = [1, 2, 3, 4, 5]

      const result = uniq(input)

      expect(result).toEqual(expectedOutput)
    })
  })

  describe('dedent', () => {
    it('should remove common leading whitespace from each line', () => {
      const input = `
        line one
        line two
        line three
      `
      const expectedOutput = `line one\nline two\nline three`

      const result = dedent(input)

      expect(result).toBe(expectedOutput)
    })

    it('should return the original string if no common leading whitespace', () => {
      const input = 'line one\nline two\nline three'
      const expectedOutput = 'line one\nline two\nline three'

      const result = dedent(input)

      expect(result).toBe(expectedOutput)
    })
  })

  describe('getHost', () => {
    it('should return the host from a URL', () => {
      const input = 'https://example.com/path'
      const expectedOutput = 'example.com'

      const result = getHost(input)

      expect(result).toBe(expectedOutput)
    })

    it('should return an empty string if no URL is provided', () => {
      const result = getHost()

      expect(result).toBe('')
    })

    it('should handle URLs with subdomains', () => {
      const input = 'https://subdomain.example.com/path'
      const expectedOutput = 'subdomain.example.com'

      const result = getHost(input)

      expect(result).toBe(expectedOutput)
    })

    it('should handle URLs with ports', () => {
      const input = 'https://example.com:8080/path'
      const expectedOutput = 'example.com:8080'

      const result = getHost(input)

      expect(result).toBe(expectedOutput)
    })

    it('should handle URLs with different protocols', () => {
      const input = 'http://example.com/path'
      const expectedOutput = 'example.com'

      const result = getHost(input)

      expect(result).toBe(expectedOutput)
    })

    it('should handle URLs with IP addresses', () => {
      const input = 'http://192.168.0.1/path'
      const expectedOutput = '192.168.0.1'

      const result = getHost(input)

      expect(result).toBe(expectedOutput)
    })

    it('should handle URLs with query parameters', () => {
      const input = 'https://example.com/path?query=param'
      const expectedOutput = 'example.com'

      const result = getHost(input)

      expect(result).toBe(expectedOutput)
    })

    it('should handle URLs with hash fragments', () => {
      const input = 'https://example.com/path#fragment'
      const expectedOutput = 'example.com'

      const result = getHost(input)

      expect(result).toBe(expectedOutput)
    })

    it('should handle URLs with auth info', () => {
      const input = 'https://user:pass@example.com/path'
      const expectedOutput = 'example.com'

      const result = getHost(input)

      expect(result).toBe(expectedOutput)
    })

    it('should handle invalid URLs gracefully', () => {
      const input = 'invalid-url'

      expect(() => getHost(input)).toThrow(new TypeError('Invalid URL'))
    })
  })
})
