import { unstable_noStore as noStore } from 'next/cache'

import { queries, getQueryByName } from '@/lib/clickhouse-queries'
import { fetchData } from '@/lib/clickhouse'
import { DataTable } from '@/components/data-table/data-table'

interface PageProps {
  params: {
    name: string
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 5

export default async function Page({ params: { name } }: PageProps) {
  noStore()

  // Get the query config
  const config = getQueryByName(name)
  if (!config) {
    return <div>404</div>
  }

  // Fetch the data from ClickHouse
  const data = await fetchData(config.sql)
  console.log('data', data)

  return (
    <div className='flex flex-col'>
      <div>
        <DataTable title={name.replace('-', ' ')} config={config} data={data} />
      </div>
    </div>
  )
}

export const generateStaticParams = async () =>
  queries.map(({ name }) => ({
    name,
  }))
