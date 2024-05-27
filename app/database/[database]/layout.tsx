import { DatabaseBreadcrumb } from './breadcrumb'

import { SingleLineSkeleton, TableSkeleton } from '@/components/skeleton'
import { Suspense } from 'react'

interface TableListProps {
  params: {
    database: string
  }
  children: React.ReactNode
}

export const revalidate = 600

export default async function TableListPage({
  params: { database },
  children,
}: TableListProps) {
  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={<SingleLineSkeleton />}>
        <DatabaseBreadcrumb database={database} />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>{children}</Suspense>
    </div>
  )
}
