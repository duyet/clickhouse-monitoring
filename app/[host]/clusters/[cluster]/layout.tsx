import { Suspense } from 'react'

import {
  ClusterListBreadcrumb,
  ClusterListBreadcrumbSkeleton,
} from './breadcrumb'

interface ClusterListProps {
  params: Promise<{
    cluster: string
  }>
  children: React.ReactNode
}

export const revalidate = 600

export default async function ClusterTabListLayout({
  params,
  children,
}: ClusterListProps) {
  const { cluster } = await params

  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={<ClusterListBreadcrumbSkeleton cluster={cluster} />}>
        <ClusterListBreadcrumb cluster={cluster} />
      </Suspense>

      {children}
    </div>
  )
}
