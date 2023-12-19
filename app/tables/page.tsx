import { redirect } from 'next/navigation'

import { fetchData } from '@/lib/clickhouse'
import { ErrorAlert } from '@/components/error-alert'

export const dynamic = 'force-dynamic'
export const revalidate = 30

export default async function TablePage() {
  let databases: { name: string; count: number }[] = []
  try {
    // List database names and number of tables
    databases = await fetchData(`
      SELECT d.name as name
      FROM system.databases AS d
      LEFT JOIN system.tables AS t ON d.name = t.database
      WHERE d.engine = 'Atomic' 
            /* some system tables do not have parts information */
            AND d.name IN (SELECT database FROM system.parts WHERE active = 1)
            AND t.name IN (SELECT table FROM system.parts WHERE active = 1)
      GROUP BY d.name
    `)

    if (!databases.length) {
      return <ErrorAlert title="Message" message="Empty" />
    }

    // Redirect to the first database
    return redirect(`/tables/${databases[0].name}`)
  } catch (e: any) {
    return (
      <ErrorAlert title="Could not getting list database" message={`${e}`} />
    )
  }
}
