import { redirectScoped } from '@/lib/scoped-link'

interface ColumnsPageProps {
  params: Promise<{
    database: string
    table: string
  }>
}

export default async function ColumnsPage({ params }: ColumnsPageProps) {
  const { database, table } = await params
  redirectScoped(`/database/${database}/${table}`)
}
