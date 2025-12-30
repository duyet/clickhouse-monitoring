'use client'

import { PageLayout } from '@/components/layout/page-layout'
import { mutationsConfig } from '@/lib/query-config/merges/mutations'

export default function MutationsPage() {
  return <PageLayout queryConfig={mutationsConfig} />
}
