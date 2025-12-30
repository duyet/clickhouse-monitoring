'use client'

import { Activity, Database, RefreshCw, Search } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { memo } from 'react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Overview', href: '/overview', icon: Activity },
  { name: 'Queries', href: '/running-queries', icon: Search },
  { name: 'Database', href: '/database', icon: Database },
  { name: 'Settings', href: '/settings', icon: RefreshCw },
]

export const HeaderNav = memo(function HeaderNav({ buildLink }: { buildLink: (path: string) => string }) {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-6">
      {navigation.map((item) => {
        const isActive = pathname?.startsWith(item.href.replace('?host=', ''))
        return (
          <Link
            key={item.name}
            href={buildLink(item.href)}
            className={cn(
              'relative flex items-center gap-2 text-xs font-medium transition-colors hover:text-foreground h-10',
              isActive ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.name}
            {isActive && (
              <span className="absolute bottom-0 left-0 h-[1.5px] w-full bg-primary animate-in fade-in slide-in-from-bottom-1" />
            )}
          </Link>
        )
      })}
    </nav>
  )
})
