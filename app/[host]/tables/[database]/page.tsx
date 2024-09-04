import { redirectScoped } from '@/lib/context'

interface TableListProps {
  params: {
    database: string
  }
}

export default async function TableListPage({
  params: { database },
}: TableListProps) {
  redirectScoped(`/database/${database}`)
}
