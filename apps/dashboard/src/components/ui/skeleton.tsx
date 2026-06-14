import { cn } from '@/lib/utils'

export interface SkeletonProps extends React.ComponentProps<'div'> {
  /**
   * Loading placeholder style.
   *
   * Defaults to `'static'` — a plain muted block with NO animation. A skeleton
   * is on screen precisely during the first-paint / data-fetch window, and a
   * continuous `animate-pulse`/`animate-shimmer` keyframe forces the compositor
   * to repaint every skeleton element each frame, competing with hydration and
   * the first real data render for the main thread. Static placeholders let the
   * browser spend those frames on real layout instead. Opt into `'pulse'` or
   * `'shimmer'` only where a long, isolated wait genuinely benefits from motion.
   */
  variant?: 'static' | 'pulse' | 'shimmer'
}

function Skeleton({ className, variant = 'static', ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'rounded-md',
        variant === 'static' && 'bg-accent',
        variant === 'pulse' && 'bg-accent animate-pulse',
        variant === 'shimmer' &&
          'relative overflow-hidden bg-accent/40 before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-foreground/5 dark:before:via-foreground/10 before:to-transparent before:will-change-transform',
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
