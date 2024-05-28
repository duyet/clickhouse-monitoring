import { ErrorAlert } from '@/components/error-alert'
import { SingleLineSkeleton, TableSkeleton } from '@/components/skeleton'

export default function Play() {
  return (
    <>
      <TableSkeleton />
      <TableSkeleton cols={5} />
      <ErrorAlert message="Error message" query="SELECT 1" />
      <SingleLineSkeleton />
      <SingleLineSkeleton className="w-[300px]" />
      <SingleLineSkeleton className="w-[200px] space-x-0 pt-0" />
    </>
  )
}
