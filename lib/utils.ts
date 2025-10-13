import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Create a class name from a list of class names
 *
 * @param inputs List of class names
 * @returns Class name
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Remove duplicate items from an array
 *
 * @param arr Array to remove duplicates from
 * @returns Array without duplicates
 */
export function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr))
}

export function dedent(str: string) {
  str = str.replace(/^\n/, '').replace(/\n\s*$/, '') // Remove leading and trailing newlines
  const match = str.match(/^[ \t]*(?=\S)/gm)
  if (!match) return str

  const indent = Math.min(...match.map((x) => x.length))
  const re = new RegExp(`^[ \\t]{${indent}}`, 'gm')

  return indent > 0 ? str.replace(re, '') : str
}

export function getHost(url?: string) {
  if (!url) return ''

  const { host } = new URL(url)
  return host
}

export function normalizeUrl(url: string) {
  return url.trim().replace(/(\/|\?)$/, '')
}

export function removeHostPrefix(pathname: string) {
  return pathname.split('/').filter(Boolean).slice(1).join('/')
}

export function binding(template: string, data: Record<string, any>): string {
  return template.replace(/\[(.*?)\]/g, (_match, p1) => {
    return data[p1] ? `${data[p1]}` : ''
  })
}

// Chart utility functions

/**
 * Format bytes to human readable format (GB, MB, KB, B)
 * @param bytes Number of bytes
 * @returns Formatted string
 */
export function formatBytes(bytes: number): string {
  // Handle edge cases
  if (bytes === 0) return '0 B'
  if (bytes < 0) return '-'
  if (!isFinite(bytes) || isNaN(bytes)) return '-'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

/**
 * Format percentage values
 * @param value Percentage value (0-100)
 * @returns Formatted string
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

/**
 * Format count values with appropriate units (K, M, B)
 * @param count Number to format
 * @returns Formatted string
 */
export function formatCount(count: number): string {
  // Handle edge cases
  if (!isFinite(count) || isNaN(count)) return '-'
  if (count < 0) return '-'
  if (count < 1000) return count.toString()

  const units = ['', 'K', 'M', 'B', 'T']
  const unitIndex = Math.floor(Math.log(count) / Math.log(1000))

  // Prevent array overflow for extremely large numbers
  const safeUnitIndex = Math.min(unitIndex, units.length - 1)

  return `${(count / Math.pow(1000, safeUnitIndex)).toFixed(1)}${units[safeUnitIndex]}`
}

/**
 * Format duration in milliseconds to human readable format
 * @param ms Duration in milliseconds
 * @returns Formatted string
 */
export function formatDuration(ms: number): string {
  // Handle edge cases
  if (!isFinite(ms) || isNaN(ms)) return '-'
  if (ms < 0) return '-'

  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`
  return `${(ms / 3600000).toFixed(1)}h`
}

/**
 * Chart tick formatter factory for different units
 */
export const chartTickFormatters = {
  bytes: (value: string | number | null | undefined) =>
    value === null || value === undefined ? '-' : formatBytes(Number(value)),
  percentage: (value: string | number | null | undefined) =>
    value === null || value === undefined
      ? '-'
      : formatPercentage(Number(value)),
  count: (value: string | number | null | undefined) =>
    value === null || value === undefined ? '-' : formatCount(Number(value)),
  duration: (value: string | number | null | undefined) =>
    value === null || value === undefined ? '-' : formatDuration(Number(value)),
  default: (value: string | number | null | undefined) =>
    value === null || value === undefined ? '-' : value.toString(),
}
