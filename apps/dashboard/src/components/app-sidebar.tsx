import { BookOpenIcon } from 'lucide-react'
import { menuItemsConfig } from '@/menu'

import { HostSwitcher } from '@/components/host/host-switcher'
import { NavUser } from '@/components/nav-user'
import { NavMain } from '@/components/navigation/nav-main'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { GUEST_USER } from '@/lib/clerk/guest-user'
import { DOCS_SITE_URL } from '@/lib/docs-site'
import { useFeaturePermissions } from '@/lib/feature-permissions/context'
import { filterMenuItemsByPermissions } from '@/lib/feature-permissions/menu'

export function AppSidebar() {
  const { config } = useFeaturePermissions()
  const menuItems = filterMenuItemsByPermissions(menuItemsConfig, config)

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <HostSwitcher />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={menuItems} />
      </SidebarContent>

      <SidebarFooter>
        {/* Small Docs link sitting just above the user button. Docs live on
            the external site (docs.chmonitor.dev), so this leaves the app. */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm" tooltip="Docs">
              <a href={DOCS_SITE_URL} target="_blank" rel="noopener noreferrer">
                <BookOpenIcon />
                <span>Docs</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser user={GUEST_USER} />
      </SidebarFooter>
    </Sidebar>
  )
}
