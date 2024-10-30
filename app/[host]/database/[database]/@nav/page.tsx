import { Nav } from './nav'

interface Props {
  params: Promise<{
    host: number
    database: string
  }>
}

export default async function Page({ params }: Props) {
  const { host, database } = await params
  return (
    <Nav
      host={host}
      database={database}
      collapsible={false}
      isCollapsed={false}
    />
  )
}
