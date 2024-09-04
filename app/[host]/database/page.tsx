import { redirectScoped } from '@/lib/context'

export const dynamic = 'force-dynamic'
export const revalidate = 30

export default function TablePage() {
  // Redirect to the default database
  redirectScoped('/tables/default')
}
