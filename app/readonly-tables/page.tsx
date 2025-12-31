'use client'

import { PageLayout } from '@/components/layout/query-page'
import { readOnlyTablesConfig } from '@/lib/query-config/tables/readonly-tables'

export default function ReadonlyTablesPage() {
  return (
    <PageLayout queryConfig={readOnlyTablesConfig} title="Readonly Tables" />
  )
}
