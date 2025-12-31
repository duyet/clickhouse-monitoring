import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { extractValue } from '../utils'
import { AnimatedNumber } from '../animated-number'

interface RenderProps<T> {
  value: string | number | ((data: T[]) => string | number) | undefined
  subtitle: string | ((data: T[]) => string) | undefined
  data: T[]
  compact: boolean
}

export function renderSubtitleVariant<T>({
  value,
  subtitle,
  data,
  compact,
}: RenderProps<T>): ReactNode {
  const resolvedValue = extractValue(value, data)
  const resolvedSubtitle =
    typeof subtitle === 'function' ? subtitle(data) : subtitle

  return (
    <div>
      <AnimatedNumber
        value={resolvedValue}
        className={cn(
          'font-mono font-bold tabular-nums tracking-tight',
          compact ? 'text-xs sm:text-sm' : 'text-xl sm:text-2xl'
        )}
      />
      {resolvedSubtitle && (
        <div
          className={cn(
            'flex items-center gap-0.5 text-muted-foreground',
            compact ? 'text-[10px] mt-0.5' : 'text-xs mt-1'
          )}
        >
          {resolvedSubtitle}
        </div>
      )}
    </div>
  )
}
