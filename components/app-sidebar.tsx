'use client'

import { menuItemsConfig } from '@/menu'

import { useMemo } from 'react'
import { HostSwitcher } from '@/components/host/host-switcher'
import { NavUser } from '@/components/nav-user'
import { NavMain } from '@/components/navigation/nav-main'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar'
import { GUEST_USER } from '@/lib/clerk/guest-user'
import { useFeaturePermissions } from '@/lib/feature-permissions/context'
import { filterMenuItemsByPermissions } from '@/lib/feature-permissions/menu'

export function AppSidebar() {
  const { config } = useFeaturePermissions()
  const menuItems = useMemo(
    () => filterMenuItemsByPermissions(menuItemsConfig, config),
    [config]
  )

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <HostSwitcher />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={menuItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={GUEST_USER} />
      </SidebarFooter>
    </Sidebar>
  )
}
