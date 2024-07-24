import { TableSkeleton } from '@/components/skeleton'
import { UpdateIcon } from '@radix-ui/react-icons'

export default function Loading() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-row items-center gap-3">
        <UpdateIcon className="size-4 animate-spin" />
        Loading system.disks ...
      </div>
      <TableSkeleton />
    </div>
  )
}
