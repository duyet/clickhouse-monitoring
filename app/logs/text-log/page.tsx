'use client'

import { PageLayout } from '@/components/layout/query-page'
import { textLogConfig } from '@/lib/query-config/logs/text-log'

export default function TextLogPage() {
  return <PageLayout queryConfig={textLogConfig} title="Server Text Log" />
}
