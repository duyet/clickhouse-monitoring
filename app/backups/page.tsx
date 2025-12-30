'use client'

import { PageLayout } from '@/components/page-layout'
import { backupsConfig } from '@/lib/query-config/more/backups'

export default function BackupsPage() {
  return <PageLayout queryConfig={backupsConfig} title="Backups" />
}
