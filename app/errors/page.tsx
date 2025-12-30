'use client'

import { PageLayout } from '@/components/layout/page-layout'
import { errorsConfig } from '@/lib/query-config/more/errors'

export default function ErrorsPage() {
  return <PageLayout queryConfig={errorsConfig} title="Errors" />
}
