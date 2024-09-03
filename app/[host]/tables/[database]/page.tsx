import { redirect } from 'next/navigation'

interface TableListProps {
  params: {
    database: string
  }
}

export default async function TableListPage({
  params: { database },
}: TableListProps) {
  redirect(`/database/${database}`)
}
