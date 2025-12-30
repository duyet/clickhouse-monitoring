'use client'

import { Suspense } from 'react'
import { TableSkeleton } from '@/components/skeletons'
import { TableClient } from '@/components/tables/table-client'
import { settingsConfig } from '@/lib/query-config/more/settings'

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <Suspense fallback={<TableSkeleton />}>
        <TableClient title="Settings" queryConfig={settingsConfig} />
      </Suspense>
    </div>
  )
}
