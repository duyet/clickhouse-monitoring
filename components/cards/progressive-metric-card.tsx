'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'

import {
  DetailedTableLevel,
  type DetailedTableLevelProps,
  HeadlineLevel,
  type HeadlineLevelProps,
  KeyMetricsLevel,
  type KeyMetricsLevelProps,
  RawDataLevel,
  type RawDataLevelProps,
} from './disclosure-levels'
import { memo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  type DisclosureLevel,
  useDisclosureState,
} from '@/lib/use-disclosure-state'
import { cn } from '@/lib/utils'

/**
 * ProgressiveMetricCard - 4-level progressive disclosure card
 *
 * A card that incrementally reveals information based on user interaction:
 * - Level 0: Headline KPIs only (default collapsed)
 * - Level 1: Headline + Key metrics with trends
 * - Level 2: Headline + Key metrics + Detailed table
 * - Level 3: All levels + Raw data/SQL
 *
 * State is persisted in URL params for shareability.
 *
 * @example
 * ```tsx
 * <ProgressiveMetricCard
 *   cardId="running-queries"
 *   headline={{ value: "15", label: "Running Queries" }}
 *   keyMetrics={{ metrics: [...] }}
 *   detailedTable={{ headers: [...], rows: [...] }}
 *   rawData={{ type: "sql", sql: "SELECT..." }}
 * />
 * ```
 */

export interface ProgressiveMetricCardProps {
  /** Unique identifier for this card (used in URL params) */
  cardId: string
  /** Card wrapper CSS classes */
  className?: string

  // Level 0: Headline
  headline: Omit<HeadlineLevelProps, 'onClick'>

  // Level 1: Key metrics
  keyMetrics?: KeyMetricsLevelProps

  // Level 2: Detailed table
  detailedTable?: DetailedTableLevelProps

  // Level 3: Raw data
  rawData?: RawDataLevelProps

  /** Optional initial disclosure level (default: 0) */
  initialLevel?: DisclosureLevel

  /** Optional callback when level changes */
  onLevelChange?: (level: DisclosureLevel) => void
}

export const ProgressiveMetricCard = memo(function ProgressiveMetricCard({
  cardId,
  className,
  headline,
  keyMetrics,
  detailedTable,
  rawData,
  initialLevel = 0,
  onLevelChange,
}: ProgressiveMetricCardProps) {
  const { level, nextLevel, setLevel, isExpanded } = useDisclosureState(
    cardId,
    initialLevel
  )

  // Notify parent of level changes
  const handleSetLevel = useCallback(
    (newLevel: DisclosureLevel) => {
      setLevel(newLevel)
      onLevelChange?.(newLevel)
    },
    [setLevel, onLevelChange]
  )

  // Expand/collapse button
  const ExpandButton = memo(function ExpandButton() {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={nextLevel}
        className={cn(
          'h-7 gap-1 text-xs text-muted-foreground',
          'transition-all duration-200',
          'hover:bg-foreground/[0.05]'
        )}
      >
        {isExpanded ? (
          <>
            <ChevronUp className="size-3" strokeWidth={2} />
            <span className="hidden sm:inline">Less</span>
          </>
        ) : (
          <>
            <ChevronDown className="size-3" strokeWidth={2} />
            <span className="hidden sm:inline">More</span>
          </>
        )}
      </Button>
    )
  })

  // Level indicator dots
  const LevelIndicator = memo(function LevelIndicator() {
    return (
      <div
        className="flex items-center gap-1"
        role="tablist"
        aria-label="Disclosure levels"
      >
        {[0, 1, 2, 3].map((l) => (
          <button
            key={l}
            onClick={() => handleSetLevel(l as DisclosureLevel)}
            className={cn(
              'size-2 rounded-full transition-all duration-200',
              'hover:scale-125',
              level >= l
                ? 'bg-primary'
                : 'bg-foreground/20 hover:bg-foreground/30'
            )}
            role="tab"
            aria-selected={level >= l}
            aria-label={`Level ${l + 1}`}
          />
        ))}
      </div>
    )
  })

  return (
    <div
      className={cn(
        'relative flex h-full flex-col justify-center overflow-hidden rounded-xl',
        'bg-gradient-to-b from-card/80 to-card/40',
        'dark:from-card/60 dark:to-card/30',
        'before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-foreground/10 before:to-transparent',
        'border border-border/50',
        'dark:border-border/30',
        'shadow-sm shadow-black/[0.03]',
        'dark:shadow-black/20',
        'backdrop-blur-xl',
        'transition-all duration-200 ease-out',
        className
      )}
      role="region"
      aria-label={`${headline.label} - showing level ${level + 1} of 4`}
    >
      {/* Level 0: Headline (always shown) */}
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="flex-1 min-w-0">
          <HeadlineLevel {...headline} onClick={nextLevel} />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <LevelIndicator />
          <ExpandButton />
        </div>
      </div>

      {/* Level 1: Key metrics */}
      {level >= 1 && keyMetrics && <KeyMetricsLevel {...keyMetrics} />}

      {/* Level 2: Detailed table */}
      {level >= 2 && detailedTable && <DetailedTableLevel {...detailedTable} />}

      {/* Level 3: Raw data */}
      {level >= 3 && rawData && <RawDataLevel {...rawData} />}
    </div>
  )
})
