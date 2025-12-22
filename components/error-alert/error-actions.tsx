'use client'

import { RefreshCwIcon } from 'lucide-react'
import { Button } from '@/components/ui'

interface ErrorActionsProps {
  onReset?: () => void
  countdown?: number
  compact?: boolean
}

export function ErrorActions({
  onReset,
  countdown = -1,
  compact = false,
}: ErrorActionsProps) {
  if (!onReset || compact) {
    return null
  }

  return (
    <div className="pt-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onReset()}
        className="flex items-center gap-2"
      >
        <RefreshCwIcon className="h-4 w-4" />
        Try again {countdown >= 0 && `(${countdown}s)`}
      </Button>
    </div>
  )
}
