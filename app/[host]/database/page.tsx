import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 30

export default function TablePage({
  params: { host },
}: {
  params: { host: number }
}) {
  // Redirect to the default database
  redirect(`/${host}/database/default`)
}
