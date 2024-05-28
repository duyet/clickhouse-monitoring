import { Suspense } from 'react'
import {
  ClusterListBreadcrumb,
  ClusterListBreadcrumbSkeleton,
} from './breadcrumb'

interface ClusterListProps {
  params: {
    cluster: string
  }
  children: React.ReactNode
}

export const revalidate = 600

export default async function ClusterTabListLayout({
  params: { cluster },
  children,
}: ClusterListProps) {
  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={<ClusterListBreadcrumbSkeleton cluster={cluster} />}>
        <ClusterListBreadcrumb cluster={cluster} />
      </Suspense>

      {children}
    </div>
  )
}
