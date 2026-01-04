export type CardVariant = 'default' | 'success' | 'warning' | 'danger'

export const cardStyles = {
  base: [
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
  ].join(' '),

  hover: [
    'cursor-pointer',
    'hover:border-border/80 dark:hover:border-border/50',
  ].join(' '),

  number: [
    'font-mono font-semibold tabular-nums tracking-tight',
    'text-foreground/90 dark:text-foreground/80',
    'text-lg sm:text-xl md:text-2xl lg:text-3xl',
    'line-clamp-1',
    '[text-shadow:0_1px_2px_rgba(0,0,0,0.05)]',
    'dark:[text-shadow:0_1px_3px_rgba(0,0,0,0.3)]',
  ].join(' '),

  label: [
    'text-[10px] uppercase tracking-widest font-medium',
    'text-foreground/45',
    'group-hover:hidden',
    'transition-opacity duration-150',
  ].join(' '),

  labelHover: [
    'text-[10px] uppercase tracking-widest font-medium',
    'text-foreground/80 dark:text-foreground/70',
    'hidden group-hover:inline',
    'transition-opacity duration-150',
  ].join(' '),

  divider: [
    'h-full w-px shrink-0',
    'bg-gradient-to-b from-transparent via-border/60 to-transparent',
  ].join(' '),
} as const

export const variantStyles: Record<CardVariant, string> = {
  default: '',
  success: [
    'border-emerald-500/30 dark:border-emerald-400/20',
    'bg-gradient-to-b from-emerald-50/50 to-emerald-50/20',
    'dark:from-emerald-950/40 dark:to-emerald-950/20',
    'shadow-emerald-500/10 dark:shadow-emerald-400/5',
  ].join(' '),
  warning: [
    'border-amber-500/30 dark:border-amber-400/20',
    'bg-gradient-to-b from-amber-50/50 to-amber-50/20',
    'dark:from-amber-950/40 dark:to-amber-950/20',
    'shadow-amber-500/10 dark:shadow-amber-400/5',
  ].join(' '),
  danger: [
    'border-rose-500/30 dark:border-rose-400/20',
    'bg-gradient-to-b from-rose-50/50 to-rose-50/20',
    'dark:from-rose-950/40 dark:to-rose-950/20',
    'shadow-rose-500/10 dark:shadow-rose-400/5',
    'animate-pulse-subtle',
  ].join(' '),
}

export const progressColors: Record<CardVariant, string> = {
  default: 'bg-gradient-to-r from-blue-500 to-blue-400',
  success: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
  warning: 'bg-gradient-to-r from-amber-500 to-amber-400',
  danger: 'bg-gradient-to-r from-rose-500 to-rose-400',
}

export const progressTrackStyles = [
  'h-2 sm:h-2.5 w-full overflow-hidden rounded-full',
  'bg-foreground/[0.06] dark:bg-foreground/[0.08]',
  'shadow-inner shadow-black/[0.03]',
].join(' ')

export const progressFillStyles = [
  'h-full rounded-full',
  'transition-all duration-700 ease-out',
  'relative overflow-hidden',
  'after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent',
  'after:animate-shimmer after:opacity-0 hover:after:opacity-100',
].join(' ')
