'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { isMenuItemActive } from '@/lib/menu/breadcrumb'

export const HostPrefixedLink = ({
  href,
  children,
  className,
  ...props
}: {
  href: string
  children: React.ReactNode
  className?: string
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const hostId = searchParams.get('host') || '0'

  // Build URL with host query parameter
  const url = `${href}?host=${hostId}`

  // Check if this link is active
  const isActive = isMenuItemActive(href, pathname)

  return (
    <Link
      prefetch={false}
      href={url}
      className={className}
      data-active={isActive ? 'true' : undefined}
      aria-current={isActive ? 'page' : undefined}
      {...props}
    >
      {children}
    </Link>
  )
}
