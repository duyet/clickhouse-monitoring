'use client'

import { HostSwitcher } from '@/components/host/host-switcher'
import { NavMain } from '@/components/navigation/nav-main'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar'
import { menuItemsConfig } from '@/menu'

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
