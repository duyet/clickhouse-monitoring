import { cn } from '@/lib/utils'

export interface CardMultiMetricsProps {
  primary?: string | number | React.ReactNode
  items?: {
    current: number
    target: number
    currentReadable?: string
    targetReadable?: string
  }[]
  currentLabel?: string
  targetLabel?: string
  className?: string
}

export function CardMultiMetrics({
  primary,
  items = [],
  currentLabel = 'Current',
  targetLabel = 'Total',
  className,
}: CardMultiMetricsProps) {
  return (
    <div
      className={cn('flex flex-col gap-4', className)}
      aria-description="card-metrics"
    >
      <div className="text-xl md:text-3xl">{primary}</div>

      <div className="flex flex-col justify-between text-sm">
        {items.length ? (
          <div className="mt-2 flex flex-row justify-between font-bold">
            <span className="truncate">{currentLabel}</span>
            <span className="truncate">{targetLabel}</span>
          </div>
        ) : null}

        {items.map((item, i) => {
          const percent = (item.current / item.target) * 100

          return (
            <div key={i}>
              <div className="mt-2 flex flex-row items-center justify-between gap-2">
                <span
                  className="truncate text-muted-foreground"
                  title={`${percent}%`}
                >
                  {item.currentReadable}
                </span>
                <hr className="shrink grow border-dotted" />
                <span className="text-nowrap">{item.targetReadable}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
