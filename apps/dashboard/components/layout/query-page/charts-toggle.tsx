/**
 * ChartsToggle Component
 *
 * Button to collapse/expand the charts section.
 * Displays appropriate icon and label based on collapsed state.
 */

'use client'

import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

export interface ChartsToggleProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function ChartsToggle({ isCollapsed, onToggle }: ChartsToggleProps) {
  return (
    <div className="flex items-center justify-end">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="h-7 gap-1 px-2 text-xs"
        aria-label={isCollapsed ? 'Show charts' : 'Hide charts'}
      >
        {isCollapsed ? (
          <>
            <span>Show Charts</span>
            <ChevronDownIcon className="size-3.5" />
          </>
        ) : (
          <>
            <span>Hide Charts</span>
            <ChevronUpIcon className="size-3.5" />
          </>
        )}
      </Button>
    </div>
  )
}
