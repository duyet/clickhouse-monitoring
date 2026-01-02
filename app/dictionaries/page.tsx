'use client'

import { PageLayout } from '@/components/layout/query-page'
import { dictionariesConfig } from '@/lib/query-config/more/dictionaries'

export default function DictionariesPage() {
  return <PageLayout queryConfig={dictionariesConfig} title="Dictionaries" />
}
