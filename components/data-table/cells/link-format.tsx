import { cn } from '@/lib/utils'
import { ArrowRightIcon } from '@radix-ui/react-icons'
import { Row, RowData } from '@tanstack/react-table'
import Link, { LinkProps } from 'next/link'

export interface LinkFormatOptions extends LinkProps {
  className?: string
  title?: string
}

interface LinkFormatProps<
  TData extends RowData,
  TValue extends React.ReactNode,
> {
  row: Row<TData>
  data: TData[]
  value: TValue
  context: Record<string, string>
  options?: LinkFormatOptions
}

export function LinkFormat<
  TData extends RowData,
  TValue extends React.ReactNode,
>({ row, data, value, context, options }: LinkFormatProps<TData, TValue>) {
  let { href, className, ...rest } = options ?? {}

  // No href provided, return value as is
  if (!href) return value

  if (typeof href === 'object' && href !== null) {
    // Handle UrlObject case here
    // For example, we might want to convert it to a string
    href = href.toString()
  }

  const originalRow = data[row.index] as Record<string, string | undefined>
  const mappingKeyValue = {
    ...originalRow,
    ...context,
  }

  // Href contains placeholders, e.g. /database/[database]/[table]
  // Replace placeholders with values from the row
  let hrefBinding = href
  if (href.includes('[') && href.includes(']')) {
    const matches = href.match(/\[(.*?)\]/g)
    if (matches) {
      matches.forEach((match) => {
        const key = match.replace('[', '').replace(']', '').trim()
        hrefBinding = hrefBinding.replace(match, mappingKeyValue[key] ?? '')
      })
    }
  }

  return (
    <Link
      href={hrefBinding}
      className={cn('group flex flex-row items-center gap-1', className)}
      {...rest}
    >
      <span className="truncate text-nowrap">{value}</span>
      <ArrowRightIcon className="size-3 flex-none text-transparent group-hover:text-current" />
    </Link>
  )
}
