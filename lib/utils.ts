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
