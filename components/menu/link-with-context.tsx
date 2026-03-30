'use client'

import { usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { AppLink as Link } from '@/components/ui/app-link'
import { isMenuItemActive } from '@/lib/menu/breadcrumb'
import { useHostId } from '@/lib/swr'
import { prefetchRoute } from '@/lib/swr/prefetch'
import { buildUrl } from '@/lib/url/url-builder'

export const HostPrefixedLink = ({
  href,
  children,
  className,
  onMouseEnter,
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

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Prefetch route data on hover using idle callback to avoid blocking
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        requestIdleCallback(() => prefetchRoute(href, hostId))
      } else {
        setTimeout(() => prefetchRoute(href, hostId), 100)
      }
      onMouseEnter?.(e)
    },
    [href, hostId, onMouseEnter]
  )

  return (
    <Link
      prefetch={false}
      href={url}
      className={className}
      data-active={isActive ? 'true' : undefined}
      aria-current={isActive ? 'page' : undefined}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </Link>
  )
}
