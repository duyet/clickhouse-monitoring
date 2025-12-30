'use client'

import { PageLayout } from '@/components/page-layout'
import { mergesConfig } from '@/lib/query-config/merges/merges'

export default function MergesPage() {
  return <PageLayout queryConfig={mergesConfig} />
}
