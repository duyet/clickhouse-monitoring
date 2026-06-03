import type { ComponentProps } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { AppLink as Link } from '@/components/ui/app-link'
import { isMenuItemActive } from '@/lib/menu/breadcrumb'
import { usePathname } from '@/lib/next-compat'
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
} & Omit<
  ComponentProps<typeof Link>,
  'to' | 'href' | 'children' | 'className'
>) => {
  const pathname = usePathname()
  const hostId = useHostId()
  const queryClient = useQueryClient()

  // Build URL with host query parameter using utility
  const url = buildUrl(href, { host: String(hostId) })

  // Check if this link is active
  const isActive = isMenuItemActive(href, pathname)

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Prefetch route data on hover using idle callback to avoid blocking
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(() => prefetchRoute(queryClient, href, hostId))
    } else {
      setTimeout(() => prefetchRoute(queryClient, href, hostId), 100)
    }
    onMouseEnter?.(e)
  }

  return (
    <Link
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
