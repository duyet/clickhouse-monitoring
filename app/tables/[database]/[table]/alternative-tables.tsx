import Link from 'next/link'
import { CardStackMinusIcon, DotFilledIcon } from '@radix-ui/react-icons'
import { ChevronDownIcon, TableIcon } from 'lucide-react'

import { fetchData } from '@/lib/clickhouse'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
    anotherTables = await fetchData(
      `SELECT name FROM system.tables WHERE database = {database: String}`,
      { database }
    )
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
          className="text-muted-foreground group flex flex-row gap-2"
        >
          <CardStackMinusIcon className="h-3 w-3" />
          {database}
          <ChevronDownIcon
            className="h-3 w-3 transition duration-300 group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        {anotherTables.map(({ name }) => (
          <DropdownMenuItem key={name}>
            <Link
              href={`/tables/${database}/${name}`}
              className="flex flex-row items-center gap-2"
            >
              {name == table ? (
                <DotFilledIcon className="h-3 w-3" />
              ) : (
                <div className="h-3 w-3" />
              )}
              <TableIcon className="h-3 w-3" />
              {name}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
