'use client'

import { PageLayout } from '@/components/layout/query-page'
import { sessionsConfig } from '@/lib/query-config/security/sessions'

export default function AuditLogPage() {
  return <PageLayout queryConfig={sessionsConfig} title="Audit Log" />
}
