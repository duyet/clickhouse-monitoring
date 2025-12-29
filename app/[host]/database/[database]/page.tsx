import { TableClient } from '@/components/table-client'
import { Toolbar } from './toolbar-client'
import { tablesListConfig } from './config'

interface TableListProps {
  params: Promise<{
    database: string
  }>
}

export default async function TableListPage({ params }: TableListProps) {
  const { database } = await params

  return (
    <TableClient
      title={database}
      queryConfig={tablesListConfig}
      searchParams={{ database }}
      topRightToolbarExtras={<Toolbar database={database} />}
    />
  )
}
