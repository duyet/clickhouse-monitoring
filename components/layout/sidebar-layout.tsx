'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { AppSidebar } from '@/components/navigation/app-sidebar'
import { Breadcrumb } from '@/components/navigation/breadcrumb'
import { HeaderActions } from '@/components/header/header-actions'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useHosts } from '@/lib/swr/use-hosts'

interface SidebarLayoutProps {
  children: React.ReactNode
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const searchParams = useSearchParams()
  const hostId = Number(searchParams.get('host') || '0')
  const { hosts } = useHosts()

  return (
    <SidebarProvider>
      <AppSidebar hosts={hosts} currentHostId={hostId} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Suspense fallback={<Skeleton className="h-4 w-32" />}>
              <Breadcrumb />
            </Suspense>
          </div>
          <div className="ml-auto px-4">
            <HeaderActions />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
