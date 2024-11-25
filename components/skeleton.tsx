import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function ChartSkeleton() {
  return (
    <div className="mb-5 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-12 rounded-md bg-slate-200" />
        <Skeleton className="h-12 rounded-md bg-slate-200" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-4 w-16 bg-slate-200" />
        <Skeleton className="h-4 w-16 bg-slate-200" />
      </div>
    </div>
  )
}

export function TableSkeleton({
  rows = 3,
  cols = 4,
  className,
}: {
  rows?: number
  cols?: number
  className?: string
}) {
  return (
    <div className={cn('mb-5 flex w-fit flex-col gap-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={`row-${i}`} className="flex flex-row items-center gap-3">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={`col-${j}`} className="h-6 w-[200px] bg-slate-200" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SingleLineSkeleton({
  className = 'w-[500px]',
}: {
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-row items-center gap-2 space-x-4 pt-5',
        className
      )}
    >
      <Skeleton className="h-6 w-3/5 bg-slate-200" />
      <Skeleton className="h-6 w-2/5 bg-slate-200" />
    </div>
  )
}

export function MultiLineSkeleton({
  className = 'w-[500px]',
}: {
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="flex w-full flex-row items-center gap-2">
        <Skeleton className="h-6 w-3/5 bg-slate-200" />
        <Skeleton className="h-6 w-2/5 bg-slate-200" />
      </div>
      <div className="flex w-full flex-row items-center gap-2">
        <Skeleton className="h-6 w-2/5 bg-slate-200" />
        <Skeleton className="h-6 w-2/5 bg-slate-200" />
        <Skeleton className="h-6 w-1/5 bg-slate-200" />
      </div>
    </div>
  )
}

export function ListSkeleton({
  nrows = 4,
  className = 'w-[500px]',
}: {
  nrows?: number
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {Array.from({ length: nrows }).map((_, i) => (
        <Skeleton key={i} className="h-6 w-full bg-slate-200" />
      ))}
    </div>
  )
}
