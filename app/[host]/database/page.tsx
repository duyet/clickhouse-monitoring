import { redirect } from 'next/navigation'

export default async function TablePage({
  params,
}: {
  params: Promise<{ host: string }>
}) {
  const { host } = await params

  // Redirect to the default database
  redirect(`/${host}/database/default`)
}
