import { redirectScoped } from '@/lib/scoped-link'

interface TableListProps {
  params: Promise<{
    database: string
  }>
}

export default async function TableListPage({ params }: TableListProps) {
  const { database } = await params
  await redirectScoped(`/database/${database}`)
}
