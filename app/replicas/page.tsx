'use client'

import { PageLayout } from '@/components/page-layout'
import { replicasConfig } from '@/lib/query-config/tables/replicas'

export default function ReplicasPage() {
  return (
    <PageLayout
      queryConfig={replicasConfig}
      title="Table Replicas"
    />
  )
}
