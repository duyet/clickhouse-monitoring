'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

export const HostPrefixedLink = ({
  href,
  children,
  ...props
}: {
  href: string
  children: React.ReactNode
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const params = useParams()
  return (
    <Link prefetch={false} href={`/${params.host}${href}`} {...props}>
      {children}
    </Link>
  )
}
