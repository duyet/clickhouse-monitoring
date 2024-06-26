import { Suspense } from 'react'
import {
  DatabaseListBreadcrumb,
  DatabaseListBreadcrumbSkeleton,
} from './breadcrumb'

interface ClusterListProps {
  params: {
    database: string
  }
  children: React.ReactNode
}

export const revalidate = 600

export default async function ClusterTabListLayout({
  params: { database },
  children,
}: ClusterListProps) {
  return (
    <div className="flex flex-col gap-5">
      <Suspense
        fallback={<DatabaseListBreadcrumbSkeleton database={database} />}
      >
        <DatabaseListBreadcrumb database={database} />
      </Suspense>

      {children}
    </div>
  )
}
