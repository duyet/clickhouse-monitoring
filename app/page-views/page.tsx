'use client'

import { PageLayout } from '@/components/layout/page-layout'
import { pageViewsConfig } from '@/lib/query-config/more/page-views'

export default function PageViewsPage() {
  return <PageLayout queryConfig={pageViewsConfig} title="Page Views" />
}
