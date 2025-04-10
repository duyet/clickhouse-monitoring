import { redirect } from 'next/navigation'

import { getDefaultDatabase } from './get-database-tables'

export default async function PartInfoRootPage({
  params,
}: {
  params: Promise<{ host: string }>
}) {
  const { host } = await params
  const defaultDatabase = await getDefaultDatabase(host)

  if (!defaultDatabase) {
    return <div>No default database found</div>
  }

  redirect(`/${host}/part-info/${defaultDatabase}`)
}
