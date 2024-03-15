import { ArrowRightIcon } from '@radix-ui/react-icons'
import Link, { LinkProps } from 'next/link'

interface LinkFormatProps {
  row: any
  value: any
  options?: LinkProps
}

export function LinkFormat({ row, value, options }: LinkFormatProps) {
  const link = options as LinkProps
  let href = link.href as string

  if (!href) return value

  // Href contains placeholders, e.g. /tables/[database]/[table]
  // Replace placeholders with values from the row
  if (href.includes('[') && href.includes(']')) {
    const matches = href.match(/\[(.*?)\]/g)
    if (matches) {
      matches.forEach((match) => {
        const key = match.replace('[', '').replace(']', '').trim()
        href = href.replace(match, row.getValue(key))
      })
    }
  }

  return (
    <Link href={href} className="group flex flex-row items-center gap-1">
      {value}
      <ArrowRightIcon className="size-3 text-transparent group-hover:text-current" />
    </Link>
  )
}
