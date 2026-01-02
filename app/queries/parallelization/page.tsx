'use client'

import { PageLayout } from '@/components/layout/query-page'
import { parallelizationConfig } from '@/lib/query-config/queries/parallelization'

export default function ParallelizationPage() {
  return <PageLayout queryConfig={parallelizationConfig} title="Query Parallelization" />
}
