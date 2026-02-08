/**
 * Announce - Simple announcement component for screen readers
 *
 * Provides a quick way to announce status changes without hooks.
 * Use this for one-time announcements in functional components.
 *
 * @example
 * ```tsx
 * import { Announce } from '@/components/accessibility/announce'
 *
 * function MyComponent() {
 *   const [message, setMessage] = useState()
 *
 *   const handleSuccess = () => {
 *     setMessage('Data saved successfully')
 *   }
 *
 *   return (
 *     <>
 *       <button onClick={handleSuccess}>Save</button>
 *       {message && <Announce message={message} />}
 *     </>
 *   )
 * }
 * ```
 */

'use client'

import { memo, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface AnnounceProps {
  /** Message to announce to screen readers */
  message: ReactNode
  /** Politeness setting */
  politeness?: 'polite' | 'assertive'
  /** Role for the live region */
  role?: 'status' | 'alert'
  /** Additional className */
  className?: string
}

/**
 * Announce - Screen reader announcement component
 *
 * Creates an aria-live region that announces content changes to screen readers.
 * Content is visually hidden (sr-only) but accessible to assistive technologies.
 */
export const Announce = memo(function Announce({
  message,
  politeness = 'polite',
  role = 'status',
  className,
}: AnnounceProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      role={role}
      className={cn('sr-only', className)}
    >
      {message}
    </div>
  )
})

/**
 * AnnounceInline - Inline announcement that can be visible
 *
 * Same as Announce but visible by default. Use for messages that should
 * be visible to all users while also being announced to screen readers.
 *
 * @example
 * ```tsx
 * <AnnounceInline message="Changes saved" politeness="polite" />
 * ```
 */
export interface AnnounceInlineProps extends AnnounceProps {
  /** Whether to hide visually (defaults to false for visible) */
  srOnly?: boolean
}

export const AnnounceInline = memo(function AnnounceInline({
  message,
  politeness = 'polite',
  role = 'status',
  className,
  srOnly = false,
}: AnnounceInlineProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      role={role}
      className={cn(srOnly && 'sr-only', className)}
    >
      {message}
    </div>
  )
})
