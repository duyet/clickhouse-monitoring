import Link from 'next/link'

import { fetchData } from '@/lib/clickhouse'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ErrorAlert } from '@/components/error-alert'

import { listDatabases } from '../queries'

interface TableListProps {
  params: {
    database: string
  }
  children: React.ReactNode
}

export default async function TableListPage({
  params: { database },
  children,
}: TableListProps) {
  let databases: { name: string; count: number }[] = []
  try {
    // List database names and number of tables
    databases = await fetchData(listDatabases)

    if (!databases.length) {
      return <ErrorAlert title="Message" message="Empty" />
    }
  } catch (e: any) {
    return (
      <ErrorAlert title="Could not getting list database" message={`${e}`} />
    )
  }

  return (
    <div className="flex flex-col">
      <div>
        <Tabs defaultValue={database} className="w-full">
          <TabsList className="mb-3">
            {databases.map(({ name, count }) => (
              <TabsTrigger key={name} value={name} asChild>
                <Link href={`/tables/${name}`}>
                  {name} ({count})
                </Link>
              </TabsTrigger>
            ))}
          </TabsList>

          {children}
        </Tabs>
      </div>
    </div>
  )
}
