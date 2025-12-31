/**
 * Shared styles for overview cards
 * Ensures visual consistency across all card components
 */

export type CardVariant = 'default' | 'success' | 'warning' | 'danger'

/**
 * Base styles used across all overview cards
 */
export const cardStyles = {
  base: 'relative flex h-full flex-col justify-center overflow-hidden rounded-lg border border-border/60 bg-card/50 backdrop-blur-sm transition-all',
  hover: 'cursor-pointer hover:border-border/80 hover:bg-card/70',
  number:
    'font-mono font-bold tabular-nums tracking-tight text-foreground/70 dark:text-foreground/60 text-lg sm:text-xl md:text-2xl lg:text-3xl line-clamp-1',
  label:
    'text-[10px] uppercase tracking-wider text-foreground/40 group-hover:hidden',
  labelHover:
    'text-[10px] uppercase tracking-wider text-foreground/90 hidden group-hover:inline',
  divider: 'h-full w-px bg-border/60 shrink-0',
} as const

/**
 * Variant-specific border and background styles
 */
export const variantStyles: Record<CardVariant, string> = {
  default: '',
  success: 'border-emerald-500/40 bg-emerald-950/20 dark:bg-emerald-500/10',
  warning: 'border-amber-500/40 bg-amber-950/20 dark:bg-amber-500/10',
  danger: 'border-rose-500/40 bg-rose-950/20 dark:bg-rose-500/10',
}

/**
 * Progress bar colors for each variant
 */
export const progressColors: Record<CardVariant, string> = {
  default: 'bg-primary',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
}
