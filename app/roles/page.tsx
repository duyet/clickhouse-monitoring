'use client'

import { Suspense } from 'react'
import { TableSkeleton } from '@/components/skeleton'
import { TableClient } from '@/components/table-client'
import { rolesConfig } from '@/lib/query-config/more/roles'

export default function RolesPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <Suspense fallback={<TableSkeleton />}>
        <TableClient
          title="Roles"
          description={rolesConfig.description}
          queryConfig={rolesConfig}
        />
      </Suspense>
    </div>
  )
}
