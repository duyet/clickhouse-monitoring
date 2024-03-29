import { redirect } from 'next/navigation'

import { ErrorAlert } from '@/components/error-alert'
import { fetchData } from '@/lib/clickhouse'

import { listDatabases } from './queries'

export const dynamic = 'force-dynamic'
export const revalidate = 30

export default async function TablePage() {
  let databases: { name: string; count: number }[] = []
  try {
    // List database names and number of tables
    databases = await fetchData({ query: listDatabases })

    if (!databases.length) {
      return <ErrorAlert title="Message" message="Empty" />
    }
  } catch (e: any) {
    return (
      <ErrorAlert title="Could not getting list database" message={`${e}`} />
    )
  }

  const targetUrl = `/tables/${databases[0].name}`

  // Redirect to the first database
  redirect(targetUrl)

  return `Redirecting to ${targetUrl} ...`
}
