import { cn } from '@/lib/utils'
import { ArrowRightIcon } from '@radix-ui/react-icons'
import type { Row, RowData } from '@tanstack/react-table'
import Link, { type LinkProps } from 'next/link'

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
    // Handle URL object - convert to full string including protocol and host
    if (href instanceof URL) {
      href = href.toString()
    } else {
      // Handle other UrlObject cases (Next.js UrlObject with pathname, query, etc.)
      href = (href as any).pathname || String(href)
    }
  }

  // Ensure href is a string at this point
  if (typeof href !== 'string') {
    return value
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
