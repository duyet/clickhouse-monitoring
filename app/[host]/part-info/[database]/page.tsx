import { redirect } from 'next/navigation'

import { getDefaultTable } from '@/app/[host]/part-info/get-database-tables'

export default async function PartInfoRootPage({
  params,
}: {
  params: Promise<{ host: string; database: string }>
}) {
  const { host, database } = await params
  const defaultTable = await getDefaultTable(host, database)

  if (!defaultTable) {
    return <div>No default table found</div>
  }

  redirect(`/${host}/part-info/${database}/${defaultTable}`)
}
