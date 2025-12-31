'use client'

import { PageLayout } from '@/components/layout/query-page'
import { replicasConfig } from '@/lib/query-config/tables/replicas'

export default function ReplicasPage() {
  return <PageLayout queryConfig={replicasConfig} title="Table Replicas" />
}
