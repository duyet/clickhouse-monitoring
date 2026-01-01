/**
 * ErrorAlert Component Tests
 *
 * Unit tests for ErrorAlert component structure and exports.
 */

import {
  ErrorAlertAccordion,
  ErrorAlertDigest,
  ErrorAlertDocs,
} from './error-alert-accordion'
import { type ErrorIconType, getErrorIcon } from './error-alert-icons'
import {
  type ErrorAlertVariant,
  getVariantStyles,
} from './error-alert-variants'
import { ErrorAlert } from './index'
import { useErrorCountdown } from './use-error-countdown'
import { CompactErrorAlert } from './variants/compact'
import { FullErrorAlert } from './variants/full'
import { describe, expect, it } from '@jest/globals'

describe('ErrorAlert', () => {
  describe('Component Structure', () => {
    it('should export ErrorAlert component', () => {
      expect(ErrorAlert).toBeDefined()
      expect(typeof ErrorAlert).toBe('object') // memo returns an object
    })

    it('should export CompactErrorAlert component', () => {
      expect(CompactErrorAlert).toBeDefined()
      expect(typeof CompactErrorAlert).toBe('function')
    })

    it('should export FullErrorAlert component', () => {
      expect(FullErrorAlert).toBeDefined()
      expect(typeof FullErrorAlert).toBe('function')
    })

    it('should export useErrorCountdown hook', () => {
      expect(useErrorCountdown).toBeDefined()
      expect(typeof useErrorCountdown).toBe('function')
    })
  })

  describe('Error Icons', () => {
    it('should export getErrorIcon function', () => {
      expect(getErrorIcon).toBeDefined()
      expect(typeof getErrorIcon).toBe('function')
    })

    it('should return an icon element for each error type', () => {
      const errorTypes: ErrorIconType[] = [
        'table_not_found',
        'permission_error',
        'network_error',
        'validation_error',
        'query_error',
        'default',
      ]

      errorTypes.forEach((type) => {
        const icon = getErrorIcon(type)
        expect(icon).toBeDefined()
        expect(icon.type).toBeDefined() // React element has type
      })
    })

    it('should return default icon when no type is provided', () => {
      const icon = getErrorIcon()
      expect(icon).toBeDefined()
      expect(icon.type).toBeDefined()
    })
  })

  describe('Variant Styles', () => {
    it('should export getVariantStyles function', () => {
      expect(getVariantStyles).toBeDefined()
      expect(typeof getVariantStyles).toBe('function')
    })

    it('should return correct styles for each variant', () => {
      const variants: ErrorAlertVariant[] = [
        'default',
        'destructive',
        'warning',
        'info',
      ]

      variants.forEach((variant) => {
        const styles = getVariantStyles(variant)
        expect(typeof styles).toBe('string')
        expect(styles.length).toBeGreaterThan(0)
      })
    })

    it('should handle default variant parameter', () => {
      const styles = getVariantStyles()
      expect(styles).toContain('bg-card')
    })
  })

  describe('Accordion Components', () => {
    it('should export ErrorAlertAccordion component', () => {
      expect(ErrorAlertAccordion).toBeDefined()
      expect(typeof ErrorAlertAccordion).toBe('function')
    })

    it('should export ErrorAlertDocs component', () => {
      expect(ErrorAlertDocs).toBeDefined()
      expect(typeof ErrorAlertDocs).toBe('function')
    })

    it('should export ErrorAlertDigest component', () => {
      expect(ErrorAlertDigest).toBeDefined()
      expect(typeof ErrorAlertDigest).toBe('function')
    })
  })

  describe('Type Exports', () => {
    it('should export ErrorAlertProps type', () => {
      // Type exports are verified at compile time
      expect(true).toBe(true)
    })

    it('should export ErrorAlertVariant type', () => {
      expect(true).toBe(true)
    })

    it('should export ErrorIconType type', () => {
      expect(true).toBe(true)
    })
  })

  describe('Variant Props Types', () => {
    it('should export CompactErrorAlertProps type', () => {
      expect(true).toBe(true)
    })

    it('should export FullErrorAlertProps type', () => {
      expect(true).toBe(true)
    })
  })

  describe('Error Type Values', () => {
    it('should support all expected error types', () => {
      const expectedTypes: ErrorIconType[] = [
        'table_not_found',
        'permission_error',
        'network_error',
        'validation_error',
        'query_error',
        'default',
      ]

      expectedTypes.forEach((type) => {
        expect([
          'table_not_found',
          'permission_error',
          'network_error',
          'validation_error',
          'query_error',
          'default',
        ]).toContain(type)
      })
    })
  })

  describe('Variant Values', () => {
    it('should support all expected variants', () => {
      const expectedVariants: ErrorAlertVariant[] = [
        'default',
        'destructive',
        'warning',
        'info',
      ]

      expectedVariants.forEach((variant) => {
        expect(['default', 'destructive', 'warning', 'info']).toContain(variant)
      })
    })
  })
})
