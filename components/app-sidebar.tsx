'use client'

import { menuItemsConfig } from '@/menu'

import { HostSwitcher } from '@/components/host/host-switcher'
import { NavUser } from '@/components/nav-user'
import { NavMain } from '@/components/navigation/nav-main'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar'

const guestUser = {
  name: 'Guest',
  email: 'guest@local',
  avatar: '',
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <HostSwitcher />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={menuItemsConfig} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={guestUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
