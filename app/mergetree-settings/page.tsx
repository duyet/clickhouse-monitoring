'use client'

import { Suspense } from 'react'
import { TableSkeleton } from '@/components/skeletons'
import { TableClient } from '@/components/tables/table-client'
import { mergeTreeSettingsConfig } from '@/lib/query-config/more/mergetree-settings'

export default function MergeTreeSettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <Suspense fallback={<TableSkeleton />}>
        <TableClient
          title="MergeTree Settings"
          queryConfig={mergeTreeSettingsConfig}
        />
      </Suspense>
    </div>
  )
}
