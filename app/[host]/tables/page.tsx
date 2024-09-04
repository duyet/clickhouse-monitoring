import { redirectScoped } from '@/lib/context'

export default async function TablePage() {
  redirectScoped('/database/default')
}
