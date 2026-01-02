/**
 * New Badge component for menu items
 *
 * Displays a "New" badge that disappears after the user visits the page
 */

'use client'

import { memo } from 'react'
import { useShowNewBadge } from '../hooks/use-visited-pages'

interface NewBadgeProps {
  href: string
  isNew?: boolean
}

export const NewBadge = memo(function NewBadge({ href, isNew }: NewBadgeProps) {
  const showBadge = useShowNewBadge(href, isNew)

  if (!showBadge) return null

  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
      New
    </span>
  )
})
