import { Suspense } from 'react'

import {
  DatabaseListBreadcrumb,
  DatabaseListBreadcrumbSkeleton,
} from './breadcrumb'

interface ClusterListProps {
  params: Promise<{
    database: string
  }>
  children: React.ReactNode
}

export default async function ClusterTabListLayout({
  params,
  children,
}: ClusterListProps) {
  const { database } = await params

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
