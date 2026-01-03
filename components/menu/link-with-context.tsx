'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isMenuItemActive } from '@/lib/menu/breadcrumb'
import { buildUrl } from '@/lib/url/url-builder'
import { useHostId } from '@/lib/swr'

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
  const pathname = usePathname()
  const hostId = useHostId()

  // Build URL with host query parameter using utility
  const url = buildUrl(href, { host: String(hostId) })

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
