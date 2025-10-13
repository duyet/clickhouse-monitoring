/**
 * Centralized date formatting utilities
 * Provides consistent date/time formatting across the application
 */

/**
 * Format options for date formatting
 */
export type DateFormatOptions = {
  includeTime?: boolean
  includeSeconds?: boolean
  includeMilliseconds?: boolean
  locale?: string
  timeZone?: string
}

/**
 * Default format options
 */
const DEFAULT_OPTIONS: Required<DateFormatOptions> = {
  includeTime: true,
  includeSeconds: true,
  includeMilliseconds: false,
  locale: 'en-US',
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
}

/**
 * Safely parse a date from various input types
 * @param input - Date, string, number, or null/undefined
 * @returns Date object or null if invalid
 */
export function parseDate(
  input: Date | string | number | null | undefined
): Date | null {
  if (input === null || input === undefined) {
    return null
  }

  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input
  }

  const parsed = new Date(input)
  return isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Format a date with consistent styling
 * @param input - Date, string, number, or null/undefined
 * @param options - Formatting options
 * @returns Formatted date string or fallback
 */
export function formatDate(
  input: Date | string | number | null | undefined,
  options: DateFormatOptions = {}
): string {
  const date = parseDate(input)
  if (!date) {
    return '-'
  }

  const opts = { ...DEFAULT_OPTIONS, ...options }

  try {
    const intlOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: opts.timeZone,
    }

    if (opts.includeTime) {
      intlOptions.hour = '2-digit'
      intlOptions.minute = '2-digit'
      intlOptions.hour12 = false

      if (opts.includeSeconds) {
        intlOptions.second = '2-digit'
      }
    }

    let formatted = new Intl.DateTimeFormat(opts.locale, intlOptions).format(
      date
    )

    // Add milliseconds if requested
    if (opts.includeTime && opts.includeMilliseconds) {
      const ms = date.getMilliseconds().toString().padStart(3, '0')
      formatted += `.${ms}`
    }

    return formatted
  } catch (error) {
    console.error('Error formatting date:', error)
    return date.toISOString()
  }
}

/**
 * Format a date as ISO 8601 string
 * @param input - Date, string, number, or null/undefined
 * @returns ISO string or fallback
 */
export function formatISO(
  input: Date | string | number | null | undefined
): string {
  const date = parseDate(input)
  if (!date) {
    return '-'
  }

  try {
    return date.toISOString()
  } catch (error) {
    console.error('Error formatting ISO date:', error)
    return '-'
  }
}

/**
 * Format a relative time (e.g., "2 hours ago")
 * @param input - Date, string, number, or null/undefined
 * @param locale - Locale for formatting
 * @returns Relative time string or fallback
 */
export function formatRelativeTime(
  input: Date | string | number | null | undefined,
  locale: string = 'en-US'
): string {
  const date = parseDate(input)
  if (!date) {
    return '-'
  }

  try {
    const now = Date.now()
    const diffMs = now - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

    if (Math.abs(diffSec) < 60) {
      return rtf.format(-diffSec, 'second')
    }
    if (Math.abs(diffMin) < 60) {
      return rtf.format(-diffMin, 'minute')
    }
    if (Math.abs(diffHour) < 24) {
      return rtf.format(-diffHour, 'hour')
    }
    if (Math.abs(diffDay) < 30) {
      return rtf.format(-diffDay, 'day')
    }

    // For older dates, use absolute formatting
    return formatDate(date, { includeTime: false })
  } catch (error) {
    console.error('Error formatting relative time:', error)
    return formatDate(date)
  }
}

/**
 * Format a duration in seconds to human-readable format
 * @param seconds - Duration in seconds
 * @param options - Formatting options
 * @returns Formatted duration string
 */
export function formatDuration(
  seconds: number | null | undefined,
  options: { precision?: number; includeMs?: boolean } = {}
): string {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return '-'
  }

  const { precision = 2, includeMs = false } = options

  if (seconds === 0) {
    return '0s'
  }

  const absSeconds = Math.abs(seconds)
  const sign = seconds < 0 ? '-' : ''

  // Less than 1 second
  if (absSeconds < 1) {
    if (includeMs) {
      return `${sign}${(absSeconds * 1000).toFixed(precision)}ms`
    }
    return `${sign}${absSeconds.toFixed(precision)}s`
  }

  // Less than 1 minute
  if (absSeconds < 60) {
    return `${sign}${absSeconds.toFixed(precision)}s`
  }

  // Less than 1 hour
  if (absSeconds < 3600) {
    const minutes = Math.floor(absSeconds / 60)
    const secs = absSeconds % 60
    return `${sign}${minutes}m ${secs.toFixed(0)}s`
  }

  // Less than 1 day
  if (absSeconds < 86400) {
    const hours = Math.floor(absSeconds / 3600)
    const minutes = Math.floor((absSeconds % 3600) / 60)
    return `${sign}${hours}h ${minutes}m`
  }

  // Days and more
  const days = Math.floor(absSeconds / 86400)
  const hours = Math.floor((absSeconds % 86400) / 3600)
  return `${sign}${days}d ${hours}h`
}

/**
 * Check if a date is valid
 * @param input - Date, string, number, or null/undefined
 * @returns true if valid date
 */
export function isValidDate(
  input: Date | string | number | null | undefined
): boolean {
  return parseDate(input) !== null
}

/**
 * Get timestamp in milliseconds
 * @param input - Date, string, number, or null/undefined
 * @returns Timestamp in milliseconds or null
 */
export function getTimestamp(
  input: Date | string | number | null | undefined
): number | null {
  const date = parseDate(input)
  return date ? date.getTime() : null
}
