import { redirectScoped } from '@/lib/scoped-link'

interface ColumnsPageProps {
  params: {
    database: string
    table: string
  }
}

export default async function ColumnsPage({
  params: { database, table },
}: ColumnsPageProps) {
  redirectScoped(`/database/${database}/${table}`)
}
