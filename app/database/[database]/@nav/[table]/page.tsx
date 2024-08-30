import { Nav } from '../nav'

interface Props {
  params: {
    database: string
  }
}

export default function Page({ params: { database } }: Props) {
  return <Nav database={database} />
}
