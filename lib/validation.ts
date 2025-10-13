/**
 * Centralized validation utilities for input parameters
 * Provides consistent validation across the application
 */

import { getClickHouseConfigs } from './clickhouse'

/**
 * Validation result interface
 */
export interface ValidationResult<T = unknown> {
  readonly isValid: boolean
  readonly value?: T
  readonly error?: string
}

/**
 * Validates and parses host ID parameter
 * @param hostId - Host ID to validate (can be string, number, null, or undefined)
 * @returns Validation result with parsed host ID
 */
export function validateHostId(
  hostId: string | number | null | undefined
): ValidationResult<number> {
  // Handle undefined, null, or empty string - use default
  if (hostId === undefined || hostId === null || hostId === '') {
    return { isValid: true, value: 0 }
  }

  // Parse to number with explicit radix
  const parsed = typeof hostId === 'string' ? parseInt(hostId, 10) : hostId

  // Check if parsing resulted in NaN
  if (isNaN(parsed)) {
    return {
      isValid: false,
      error: `Invalid hostId: "${hostId}". Must be a valid number.`,
    }
  }

  // Check if hostId is negative
  if (parsed < 0) {
    return {
      isValid: false,
      error: `Invalid hostId: ${parsed}. Must be non-negative.`,
    }
  }

  // Check if hostId exists in configured hosts
  const configs = getClickHouseConfigs()
  if (configs.length === 0) {
    return {
      isValid: false,
      error:
        'No ClickHouse hosts configured. Please set CLICKHOUSE_HOST environment variable.',
    }
  }

  if (parsed >= configs.length) {
    return {
      isValid: false,
      error: `Invalid hostId: ${parsed}. Available hosts: 0-${configs.length - 1} (total: ${configs.length})`,
    }
  }

  return { isValid: true, value: parsed }
}

/**
 * Validates URL parameter
 * @param url - URL to validate
 * @returns Validation result with validated URL
 */
export function validateUrl(
  url: string | null | undefined
): ValidationResult<string> {
  if (!url || url.trim() === '') {
    return {
      isValid: false,
      error: 'URL parameter is required and cannot be empty',
    }
  }

  const trimmedUrl = url.trim()

  // Basic URL format validation
  try {
    new URL(trimmedUrl)
    return { isValid: true, value: trimmedUrl }
  } catch {
    // If not a full URL, check if it's a valid path
    if (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('http')) {
      return { isValid: true, value: trimmedUrl }
    }

    return {
      isValid: false,
      error: `Invalid URL format: "${trimmedUrl}"`,
    }
  }
}

/**
 * Validates numeric parameter within range
 * @param value - Value to validate
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive)
 * @param paramName - Parameter name for error messages
 * @returns Validation result with parsed number
 */
export function validateNumericRange(
  value: string | number | null | undefined,
  min: number,
  max: number,
  paramName = 'value'
): ValidationResult<number> {
  if (value === undefined || value === null || value === '') {
    return {
      isValid: false,
      error: `${paramName} is required`,
    }
  }

  const parsed = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(parsed)) {
    return {
      isValid: false,
      error: `${paramName} must be a valid number`,
    }
  }

  if (parsed < min || parsed > max) {
    return {
      isValid: false,
      error: `${paramName} must be between ${min} and ${max} (received: ${parsed})`,
    }
  }

  return { isValid: true, value: parsed }
}

/**
 * Validates string parameter
 * @param value - Value to validate
 * @param paramName - Parameter name for error messages
 * @param minLength - Minimum string length (optional)
 * @param maxLength - Maximum string length (optional)
 * @returns Validation result with validated string
 */
export function validateString(
  value: string | null | undefined,
  paramName = 'value',
  minLength?: number,
  maxLength?: number
): ValidationResult<string> {
  if (value === null || value === undefined) {
    return {
      isValid: false,
      error: `${paramName} is required`,
    }
  }

  const trimmed = value.trim()

  if (minLength !== undefined && trimmed.length < minLength) {
    return {
      isValid: false,
      error: `${paramName} must be at least ${minLength} characters (received: ${trimmed.length})`,
    }
  }

  if (maxLength !== undefined && trimmed.length > maxLength) {
    return {
      isValid: false,
      error: `${paramName} must be at most ${maxLength} characters (received: ${trimmed.length})`,
    }
  }

  return { isValid: true, value: trimmed }
}

/**
 * Validates enum parameter
 * @param value - Value to validate
 * @param allowedValues - Array of allowed values
 * @param paramName - Parameter name for error messages
 * @returns Validation result with validated value
 */
export function validateEnum<T extends string | number>(
  value: T | null | undefined,
  allowedValues: readonly T[],
  paramName = 'value'
): ValidationResult<T> {
  if (value === null || value === undefined) {
    return {
      isValid: false,
      error: `${paramName} is required`,
    }
  }

  if (!allowedValues.includes(value)) {
    return {
      isValid: false,
      error: `${paramName} must be one of: ${allowedValues.join(', ')} (received: ${value})`,
    }
  }

  return { isValid: true, value }
}

/**
 * Safe array access with bounds checking
 * @param array - Array to access
 * @param index - Index to access
 * @param defaultValue - Default value if index is out of bounds
 * @returns Array element or default value
 */
export function safeArrayAccess<T>(
  array: readonly T[] | T[] | null | undefined,
  index: number,
  defaultValue?: T
): T | undefined {
  if (!array || !Array.isArray(array)) {
    return defaultValue
  }

  if (index < 0 || index >= array.length) {
    return defaultValue
  }

  return array[index]
}

/**
 * Safe object property access
 * @param obj - Object to access
 * @param key - Property key
 * @param defaultValue - Default value if property doesn't exist
 * @returns Property value or default value
 */
export function safePropertyAccess<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  defaultValue?: T[K]
): T[K] | undefined {
  if (!obj || typeof obj !== 'object') {
    return defaultValue
  }

  return obj[key] ?? defaultValue
}
