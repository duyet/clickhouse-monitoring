import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 30

export default async function TablePage({
  params,
}: {
  params: Promise<{ host: number }>
}) {
  const { host } = await params

  // Redirect to the default database
  redirect(`/${host}/database/default`)
}
