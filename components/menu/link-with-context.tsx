'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export const HostPrefixedLink = ({
  href,
  children,
  ...props
}: {
  href: string
  children: React.ReactNode
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const searchParams = useSearchParams()
  const hostId = searchParams.get('host') || '0'

  // Build URL with host query parameter
  const url = `${href}?host=${hostId}`

  return (
    <Link prefetch={false} href={url} {...props}>
      {children}
    </Link>
  )
}
