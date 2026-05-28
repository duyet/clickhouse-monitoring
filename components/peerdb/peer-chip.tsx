import type { DBType } from '@/lib/peerdb/types'

import { peerKind } from './peerdb-utils'
import { cn } from '@/lib/utils'

interface PeerChipProps {
  name?: string
  type?: DBType
  size?: 'xs' | 'sm' | 'lg'
  dim?: boolean
  className?: string
}

/**
 * Compact peer identity chip: a brand-hued 2-letter monogram + the peer name.
 * Ported from the CHM Redesign PeerChip (peerdb-data.jsx).
 */
export function PeerChip({
  name,
  type,
  size = 'sm',
  dim = false,
  className,
}: PeerChipProps) {
  const k = peerKind(type)
  const shell =
    size === 'lg'
      ? 'h-7 text-[12px]'
      : size === 'xs'
        ? 'h-5 text-[10.5px]'
        : 'h-6 text-[11.5px]'
  const mono =
    size === 'lg'
      ? 'w-6 h-6 text-[10.5px]'
      : size === 'xs'
        ? 'w-4 h-4 text-[8.5px]'
        : 'w-5 h-5 text-[9.5px]'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-border bg-card pr-2',
        shell,
        dim && 'opacity-70',
        className
      )}
    >
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-l-[5px] font-mono font-bold',
          mono
        )}
        style={{ background: k.bg, color: k.fg }}
      >
        {k.mono}
      </span>
      <span className="max-w-[140px] truncate font-medium" title={name}>
        {name ?? k.label}
      </span>
    </span>
  )
}
