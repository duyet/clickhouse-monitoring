'use client'

import { PageLayout } from '@/components/layout/query-page'
import { mergesConfig } from '@/lib/query-config/merges/merges'

export default function MergesPage() {
  return <PageLayout queryConfig={mergesConfig} />
}
