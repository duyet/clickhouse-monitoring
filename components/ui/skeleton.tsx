import { cn } from '@/lib/utils'

/**
 * Enhanced Skeleton component with shimmer animation
 *
 * Provides visual feedback during content loading with:
 * - Shimmer effect (sweeping highlight)
 * - Subtle pulse animation
 * - Fade-in transition when removed
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'bg-accent/50 animate-shimmer rounded-md',
        'relative overflow-hidden',
        'before:absolute before:inset-0 before:-translate-x-full',
        'before:animate-[shimmer_1.5s_infinite]',
        'before:bg-gradient-to-r',
        'before:from-transparent before:via-accent/40 before:to-transparent',
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
