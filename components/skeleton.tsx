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

export function TableSkeleton() {
  return (
    <div className="flex items-center space-x-4 pt-5">
      <div className="space-y-2">
        <Skeleton className="h-6 w-[500px] bg-slate-200" />
        <Skeleton className="h-6 w-[450px] bg-slate-200" />
      </div>
    </div>
  )
}
