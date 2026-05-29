import type { FlowStatus } from '@/lib/peerdb/types'

import { type StatusTone, statusLabel, statusTone } from './peerdb-utils'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/** Per-tone className applied at the usage site (never editing ui/badge). */
const TONE_CLASS: Record<StatusTone, string> = {
  running:
    'border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  paused:
    'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  failed:
    'border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  progress:
    'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  idle: 'border-transparent bg-muted text-muted-foreground',
}

interface MirrorStatusBadgeProps {
  status?: FlowStatus
  className?: string
}

export function MirrorStatusBadge({
  status,
  className,
}: MirrorStatusBadgeProps) {
  const tone = statusTone(status)
  return (
    <Badge
      variant="outline"
      className={cn(TONE_CLASS[tone], className)}
      title={status}
    >
      {statusLabel(status)}
    </Badge>
  )
}
