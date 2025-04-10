import { TableSkeleton } from '@/components/skeleton'

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <TableSkeleton />
      <TableSkeleton />
    </div>
  )
}
