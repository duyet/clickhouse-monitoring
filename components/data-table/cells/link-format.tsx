import { ArrowRightIcon } from '@radix-ui/react-icons'
import { Row, RowData } from '@tanstack/react-table'
import Link, { LinkProps } from 'next/link'

interface LinkFormatProps<
  TData extends RowData,
  TValue extends React.ReactNode,
> {
  row: Row<TData>
  data: TData[]
  value: TValue
  options?: LinkProps
}

export function LinkFormat<
  TData extends RowData,
  TValue extends React.ReactNode,
>({ row, data, value, options }: LinkFormatProps<TData, TValue>) {
  let href = options?.href

  // No href provided, return value as is
  if (!href) return value

  if (typeof href === 'object' && href !== null) {
    // Handle UrlObject case here
    // For example, we might want to convert it to a string
    href = href.toString()
  }

  const originalRow = data[row.index] as Record<string, string | undefined>

  // Href contains placeholders, e.g. /tables/[database]/[table]
  // Replace placeholders with values from the row
  let hrefBinding = href
  if (href.includes('[') && href.includes(']')) {
    const matches = href.match(/\[(.*?)\]/g)
    if (matches) {
      matches.forEach((match) => {
        const key = match.replace('[', '').replace(']', '').trim()
        hrefBinding = hrefBinding.replace(match, originalRow[key] ?? '')
      })
    }
  }

  return (
    <Link href={hrefBinding} className="group flex flex-row items-center gap-1">
      <span className="text-nowrap">{value}</span>
      <ArrowRightIcon className="size-3 text-transparent group-hover:text-current" />
    </Link>
  )
}
