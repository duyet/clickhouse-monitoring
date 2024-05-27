import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 30

export default function TablePage() {
  // Redirect to the default database
  redirect('/tables/default')
}
