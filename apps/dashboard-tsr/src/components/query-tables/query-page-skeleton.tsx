import { Skeleton } from '@/components/skeletons'

/** Skeleton placeholder shown during the initial load of query tables. */
export function QueryPageSkeleton({
  rows = 5,
}: {
  /** Number of skeleton rows. Defaults to 5. */
  rows?: number
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="ml-auto h-4 w-16" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-border p-3"
        >
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}
