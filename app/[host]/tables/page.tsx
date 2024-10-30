import { redirectScoped } from '@/lib/scoped-link'

export default async function TablePage() {
  await redirectScoped('/database/default')
}
