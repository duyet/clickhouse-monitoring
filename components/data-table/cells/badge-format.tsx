import { cn } from '@/lib/utils'

interface BadgeFormatProps {
  value: React.ReactNode
  className?: string
}

export function BadgeFormat({
  value,
  className,
}: BadgeFormatProps): React.ReactNode {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        className
      )}
      style={{
        backgroundColor: 'hsl(var(--badge-success-bg))',
        color: 'hsl(var(--badge-success-text))',
      }}
    >
      {value}
    </span>
  )
}
