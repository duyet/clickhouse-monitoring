import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export { Skeleton }

export function ChartSkeleton({
  title,
  type: _type,
  className,
}: {
  title?: string
  type?: string
  className?: string
} = {}) {
  return (
    <Card>
      <CardHeader>
        <Skeleton variant="shimmer" className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton variant="shimmer" className="h-48 w-full" />
      </CardContent>
    </Card>
  )
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }, (_, i) => `skeleton-row-${i}`).map(
        (key) => (
          <Skeleton key={key} variant="shimmer" className="h-9 w-full" />
        )
      )}
    </div>
  )
}

// Additional page-scoped skeletons re-exported from their sub-files (the
// foundation kept ChartSkeleton/TableSkeleton inline with the shimmer variant).
export { ExplorerSkeleton } from './explorer'
export {
  ChartsOnlyPageSkeleton,
  PageSkeleton,
  TableOnlyPageSkeleton,
} from './page'
export { SidebarSkeleton } from './sidebar'
export { TabsSkeleton } from './tabs'
export { ListSkeleton, MultiLineSkeleton, SingleLineSkeleton } from './ui'
