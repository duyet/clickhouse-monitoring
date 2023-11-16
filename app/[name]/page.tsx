import { queries, getQueryByName } from '@/lib/clickhouse-queries'
import { fetchData } from '@/lib/clickhouse'
import { DataTable } from '@/components/data-table/data-table'

interface PageProps {
  params: {
    name: string
  }
}

export default async function Page({ params: { name } }: PageProps) {
  const config = getQueryByName(name)

  if (!config) {
    return <div>404</div>
  }

  const data = await fetchData(config.sql)
  console.log('data', data)

  return (
    <div className='flex flex-col'>
      <h1 className='text-muted-foreground mb-3 text-xl'>{name}</h1>
      <div>
        <DataTable config={config} data={data} />
      </div>
    </div>
  )
}

export const generateStaticParams = async () =>
  queries.map(({ name }) => ({
    name,
  }))
