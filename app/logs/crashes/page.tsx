'use client'

import { PageLayout } from '@/components/layout/query-page'
import { crashLogConfig } from '@/lib/query-config/logs/crashes'

export default function CrashesPage() {
  return <PageLayout queryConfig={crashLogConfig} title="Crash Log" />
}
