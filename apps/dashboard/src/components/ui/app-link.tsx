import { Link } from '@tanstack/react-router'

import type { ComponentProps } from 'react'

/**
 * Framework-agnostic Link component.
 * Wraps TanStack Router's Link for consistent usage across the app.
 */
export function AppLink(props: ComponentProps<typeof Link>) {
  return <Link {...props} />
}
