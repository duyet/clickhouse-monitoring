import { Nav } from './nav'

interface Props {
  params: {
    host: number
    database: string
  }
}

export default function Page({ params: { host, database } }: Props) {
  return (
    <Nav
      host={host}
      database={database}
      collapsible={false}
      isCollapsed={false}
    />
  )
}
