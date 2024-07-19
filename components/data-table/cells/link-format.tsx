import { ArrowRightIcon } from '@radix-ui/react-icons'
import { Row, RowData } from '@tanstack/react-table'
import Link, { LinkProps } from 'next/link'

interface LinkFormatProps<TData extends RowData, TValue> {
  row: Row<TData>
  data: TData[]
  value: any
  options?: LinkProps
}

export function LinkFormat<TData extends RowData, TValue>({
  row,
  data,
  value,
  options,
}: LinkFormatProps<TData, TValue>) {
  const link = options as LinkProps
  let href = link.href as string

  if (!href) return value

  const originalRow = data[row.index] as Record<string, string | undefined>

  // Href contains placeholders, e.g. /tables/[database]/[table]
  // Replace placeholders with values from the row
  if (href.includes('[') && href.includes(']')) {
    const matches = href.match(/\[(.*?)\]/g)
    if (matches) {
      matches.forEach((match) => {
        const key = match.replace('[', '').replace(']', '').trim()
        href = href.replace(match, originalRow[key] ?? '')
      })
    }
  }

  return (
    <Link href={href} className="group flex flex-row items-center gap-1">
      <span className="text-nowrap">{value}</span>
      <ArrowRightIcon className="size-3 text-transparent group-hover:text-current" />
    </Link>
  )
}
