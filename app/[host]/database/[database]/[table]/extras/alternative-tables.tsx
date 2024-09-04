import { CardStackMinusIcon, DotFilledIcon } from '@radix-ui/react-icons'
import { ChevronDownIcon, TableIcon } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { fetchData } from '@/lib/clickhouse'
import { getScopedLink } from '@/lib/context'

interface AlternativeTablesProps {
  database: string
  table: string
}

export async function AlternativeTables({
  database,
  table,
}: AlternativeTablesProps) {
  let anotherTables: { name: string }[] = []
  try {
    const res = await fetchData<{ name: string }[]>({
      query: `
        SELECT name
        FROM system.tables
        WHERE database = {database: String}
      `,
      query_params: { database },
    })

    anotherTables = res.data
  } catch (error) {
    console.log(error)

    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="group flex flex-row gap-2 text-muted-foreground"
        >
          <CardStackMinusIcon className="size-3" />
          {table}
          <ChevronDownIcon
            className="size-3 transition duration-300 group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        {anotherTables.map(({ name }) => (
          <DropdownMenuItem key={name}>
            <Link
              href={getScopedLink(`/tables/${database}/${name}`)}
              className="flex flex-row items-center gap-2"
            >
              {name == table ? (
                <DotFilledIcon className="size-3" />
              ) : (
                <div className="size-3" />
              )}
              <TableIcon className="size-3" />
              {name}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
