import { Suspense } from 'react'
import { getDatabases, getDatabaseTables } from './get-database-tables'
import { DatabaseSelector, TableSelector } from './selectors'

export default async function PartInfoLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ host: string; database?: string; table?: string }>
}) {
  const { host, database, table } = await params

  const databaseTables = await getDatabaseTables(host)
  const databases = await getDatabases(host)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Suspense fallback={<div>Loading Databases...</div>}>
          <DatabaseSelector host={host} databases={databases} />
        </Suspense>
        <Suspense fallback={<div>Loading Tables...</div>}>
          <TableSelector host={host} databaseTables={databaseTables} />
        </Suspense>
      </div>
      {children}
    </div>
  )
}
