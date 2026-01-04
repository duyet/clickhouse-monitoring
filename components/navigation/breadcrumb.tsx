'use client'

import { ChevronRightIcon } from 'lucide-react'

import { usePathname } from 'next/navigation'
import { memo, useMemo } from 'react'
import { HostPrefixedLink } from '@/components/menu/link-with-context'
import { getBreadcrumbPath } from '@/lib/menu/breadcrumb'
import { cn } from '@/lib/utils'

interface BreadcrumbProps {
  className?: string
}

export const Breadcrumb = memo(function Breadcrumb({
  className,
}: BreadcrumbProps) {
  const pathname = usePathname()

  const breadcrumbs = useMemo(() => {
    return getBreadcrumbPath(pathname)
  }, [pathname])

  return (
    <nav
      aria-label="Breadcrumb navigation"
      className={cn('flex items-center', className)}
    >
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1

          return (
            <li key={crumb.href} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRightIcon
                  className="size-3.5 shrink-0"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              )}
              {isLast ? (
                <span
                  className="font-medium text-foreground"
                  aria-current="page"
                >
                  {crumb.title}
                </span>
              ) : (
                <HostPrefixedLink
                  href={crumb.href}
                  className="hover:text-foreground hover:underline transition-colors"
                >
                  {crumb.title}
                </HostPrefixedLink>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
})
