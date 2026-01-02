'use client'

import { PageLayout } from '@/components/layout/query-page'
import { threadAnalysisConfig } from '@/lib/query-config/queries/thread-analysis'

export default function ThreadAnalysisPage() {
  return (
    <PageLayout queryConfig={threadAnalysisConfig} title="Thread Analysis" />
  )
}
