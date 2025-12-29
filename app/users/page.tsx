'use client'

import { Suspense } from 'react'
import { TableSkeleton } from '@/components/skeleton'
import { TableClient } from '@/components/table-client'
import { usersConfig } from '@/lib/query-config/more/users'

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <Suspense fallback={<TableSkeleton />}>
        <TableClient
          title="Users"
          description={usersConfig.description}
          queryConfig={usersConfig}
        />
      </Suspense>
    </div>
  )
}
