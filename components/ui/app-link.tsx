'use client'

import type { ComponentProps } from 'react'

import Link from 'next/link'

/**
 * Framework-agnostic Link component.
 * Currently wraps next/link. At migration time, swap the inner import.
 */
export function AppLink(props: ComponentProps<typeof Link>) {
  return <Link {...props} />
}
