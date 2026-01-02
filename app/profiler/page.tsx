'use client'

import { PageLayout } from '@/components/layout/query-page'
import { profilerConfig } from '@/lib/query-config/queries/profiler'

export default function ProfilerPage() {
  return <PageLayout queryConfig={profilerConfig} title="Query Profiler" />
}
