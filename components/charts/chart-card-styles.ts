import { cn } from '@/lib/utils'

/**
 * Shared chart card styling constants
 *
 * Centralized class names for all chart card states (loading, empty, error, data)
 * to ensure consistent padding, spacing, and appearance across the application.
 *
 * @example
 * ```tsx
 * import { chartCard } from '@/components/charts/chart-card-styles'
 *
 * <Card className={cn(chartCard.base, chartCard.variants.default)}>
 *   <CardHeader className={chartCard.header}>
 *   <CardContent className={chartCard.content}>
 * ```
 */
export const chartCard = {
  /**
   * Base card container styles - applies to all chart card types
   */
  base: cn('flex flex-col h-full gap-2', 'border-border/50', 'shadow-none'),

  /**
   * Card-specific styles per state type
   */
  variants: {
    /** Loading and empty states - simpler appearance */
    default: cn('rounded-lg', 'bg-card/50', 'py-2'),

    /** Error state - applies error-specific coloring via errorClassName */
    error: cn('rounded-lg', 'bg-card/50', 'py-2'),

    /** Normal data state - enhanced visual treatment */
    normal: cn(
      'relative w-full min-w-0 group',
      'overflow-hidden rounded-xl',
      'bg-gradient-to-b from-card/80 to-card/40 dark:from-card/60 dark:to-card/30',
      'border dark:border-border/30',
      'shadow-sm shadow-black/[0.03] dark:shadow-black/20',
      'backdrop-blur-xl',
      'before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-foreground/10 before:to-transparent',
      'transition-colors duration-200 ease-out',
      'hover:border-border/80 dark:hover:border-border/50',
      'pt-1 pb-2'
    ),
  },

  /** Card header styles - consistent across all states */
  header: 'px-2 shrink-0',

  /** Card content styles - consistent across all states */
  content: 'p-4 pt-0 flex-1 min-h-0',

  /** Compact content padding (for small/compact variants) */
  contentCompact: 'p-3 flex-1 min-h-0',

  /** Error state content (no header, so full padding) */
  contentError: 'p-4 flex-1 min-h-0',
} as const
