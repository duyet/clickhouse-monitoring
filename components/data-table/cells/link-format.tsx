import { ArrowRightIcon } from '@radix-ui/react-icons'
import type { Row, RowData } from '@tanstack/react-table'

import Link, { type LinkProps } from 'next/link'
import { memo } from 'react'
import { replaceTemplateVariables } from '@/lib/template-utils'
import { cn } from '@/lib/utils'

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

function LinkFormatComponent<
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
  const hrefBinding = replaceTemplateVariables(href, mappingKeyValue)

  return (
    <Link
      href={hrefBinding}
      className={cn(
        'group inline-flex flex-row items-center gap-1 transition-colors',
        'text-foreground hover:text-primary',
        className
      )}
      {...rest}
    >
      <span className="truncate">{value}</span>
      <ArrowRightIcon
        className="size-3 flex-none text-transparent transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-current"
        aria-hidden="true"
      />
    </Link>
  )
}

// Use a simpler memo approach without complex type casting
export const LinkFormat = memo(
  LinkFormatComponent
) as typeof LinkFormatComponent & {
  displayName?: string
}
