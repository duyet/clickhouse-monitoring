'use client'

import { PageLayout } from '@/components/layout/query-page'
import { stackTracesConfig } from '@/lib/query-config/logs/stack-traces'

export default function StackTracesPage() {
  return (
    <PageLayout queryConfig={stackTracesConfig} title="Current Stack Traces" />
  )
}
