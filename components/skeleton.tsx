import { Skeleton } from '@/components/ui/skeleton'

export function ChartSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-12 rounded-md" />
        <Skeleton className="h-12 rounded-md" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  )
}

export function TableSkeleton({
  rows = 3,
  cols = 4,
}: {
  rows?: number
  cols?: number
}) {
  return (
    <div className="flex flex-col gap-3">
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

export function SingleLineSkeleton() {
  return (
    <div className="flex flex-row items-center space-x-4 pt-5">
      <Skeleton className="h-6 w-[300px] bg-slate-200" />
      <Skeleton className="h-6 w-[200px] bg-slate-200" />
    </div>
  )
}
