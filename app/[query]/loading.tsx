import { TableSkeleton } from '@/components/skeleton'

// Loading indicator component.
export default function Loading() {
  return (
    <div className="flex flex-row items-center gap-3">
      <TableSkeleton />
    </div>
  )
}
