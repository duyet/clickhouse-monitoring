'use client'

import { createPage } from '@/lib/create-page'
import { auditLogConfig } from '@/lib/query-config/security/audit-log'

export default createPage({
  queryConfig: auditLogConfig,
  title: 'Audit Log',
})
