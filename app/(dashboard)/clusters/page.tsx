'use client'

import { TableClient } from '@/components/tables/table-client'
import { queryConfig } from '@/lib/api/clusters-api'

export default function ClustersPage() {
  return (
    <TableClient
      title={queryConfig.name}
      description={queryConfig.description}
      queryConfig={queryConfig}
    />
  )
}
