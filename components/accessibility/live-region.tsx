'use client'

import { useEffect, useRef, useState } from 'react'

interface LiveRegionProps {
  /** Content to announce */
  children: string
  /** Politeness level: 'polite' waits for user idle, 'assertive' interrupts immediately */
  politeness?: 'polite' | 'assertive'
  /** Whether the announcement should be visible (defaults to hidden for screen readers only) */
  visible?: boolean
  /** Additional className for visible announcements */
  className?: string
}

/**
 * LiveRegion - Announces dynamic content changes to screen readers
 *
 * Use this component to announce state changes, loading states, or updates
 * that occur without page navigation. Essential for SPAs and dynamic content.
 *
 * @example
 * ```tsx
 * const [status, setStatus] = useState('Loading...')
 *
 * <LiveRegion politeness="polite">{status}</LiveRegion>
 * ```
 */
export function LiveRegion({
  children,
  politeness = 'polite',
  visible = false,
  className,
}: LiveRegionProps) {
  const [announcement, setAnnouncement] = useState('')
  const previousChildren = useRef<string>()

  useEffect(() => {
    // Only announce when content actually changes
    if (children !== previousChildren.current && children) {
      // Small delay to ensure screen reader registers the change
      const timer = setTimeout(() => {
        setAnnouncement(children)
        previousChildren.current = children
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [children])

  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className={visible ? className : 'sr-only'}
      role="status"
    >
      {announcement}
    </div>
  )
}

interface UseAnnouncementOptions {
  /** Politeness level for announcements */
  politeness?: 'polite' | 'assertive'
  /** Clear announcement after delay (ms) */
  clearDelay?: number
}

/**
 * useAnnouncement - Hook for managing screen reader announcements
 *
 * Provides a simple API for announcing dynamic changes throughout your app.
 *
 * @example
 * ```tsx
 * function ChartComponent() {
 *   const { announce, Announcement } = useAnnouncement()
 *
 *   const handleRefresh = () => {
 *     refreshData()
 *     announce('Chart data refreshed')
 *   }
 *
 *   return (
 *     <>
 *       <button onClick={handleRefresh}>Refresh</button>
 *       <Announcement />
 *     </>
 *   )
 * }
 * ```
 */
export function useAnnouncement(options: UseAnnouncementOptions = {}) {
  const { politeness = 'polite', clearDelay = 5000 } = options
  const [announcement, setAnnouncement] = useState('')

  const announce = (message: string) => {
    setAnnouncement(message)
    if (clearDelay > 0) {
      setTimeout(() => setAnnouncement(''), clearDelay)
    }
  }

  const AnnouncementComponent = () =>
    announcement ? (
      <LiveRegion politeness={politeness}>{announcement}</LiveRegion>
    ) : null

  return {
    announce,
    Announcement: AnnouncementComponent,
  }
}

interface StatusMessageProps {
  /** Message to announce */
  message: string | null | undefined
  /** Politeness level */
  politeness?: 'polite' | 'assertive'
  /** Role for the status region */
  role?: 'status' | 'alert'
}

/**
 * StatusMessage - Simple status announcement component
 *
 * Announces status changes like loading, success, or error states.
 * Automatically clears when message becomes null/undefined.
 *
 * @example
 * ```tsx
 * function DataTable() {
 *   const { data, error, isLoading } = useSWR()
 *
 *   return (
 *     <>
 *       <StatusMessage
 *         message={isLoading ? 'Loading data...' : error ? 'Failed to load' : null}
 *         politeness="polite"
 *       />
 *       <Table data={data} />
 *     </>
 *   )
 * }
 * ```
 */
export function StatusMessage({
  message,
  politeness = 'polite',
  role = 'status',
}: StatusMessageProps) {
  if (!message) return null

  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      role={role}
      className="sr-only"
    >
      {message}
    </div>
  )
}
