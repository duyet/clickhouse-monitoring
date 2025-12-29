import { TableClient } from '@/components/table-client'
import { queryConfig } from './config'

export default function ClustersPage() {
  return (
    <TableClient
      title={queryConfig.name}
      description={queryConfig.description}
      queryConfig={queryConfig}
    />
  )
}
