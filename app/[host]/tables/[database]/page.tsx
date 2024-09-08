import { redirectScoped } from '@/lib/scoped-link'

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
