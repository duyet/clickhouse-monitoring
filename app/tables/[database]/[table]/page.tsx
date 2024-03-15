import { redirect } from 'next/navigation'

interface ColumnsPageProps {
  params: {
    database: string
    table: string
  }
}

export default async function ColumnsPage({
  params: { database, table },
}: ColumnsPageProps) {
  redirect(`/database/${database}/${table}`)
}
