import { cn } from '@/lib/utils'

export interface SkeletonProps extends React.ComponentProps<'div'> {
  variant?: 'pulse' | 'shimmer'
}

function Skeleton({ className, variant = 'pulse', ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'rounded-md',
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
