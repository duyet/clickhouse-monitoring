import { HamburgerMenuIcon } from '@radix-ui/react-icons'

import { Button } from '@/components/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui'
import { menuItemsConfig } from '@/menu'

import { HostPrefixedLink } from './link-with-context'
import { MenuItemHeader, MenuIcon, getFilteredMenuItems } from './menu-shared'
import type { MenuItem } from './types'

export interface MenuProps {
  items?: MenuItem[]
  className?: string
}

export function MenuDropdownStyle({
  items = menuItemsConfig,
  className,
}: MenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className} role="menu">
          <HamburgerMenuIcon className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {items.map((item) => (
          <MenuItem key={item.href} item={item} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SingleItemDropdown({
  href,
  title,
  icon,
}: {
  href: string
  title: string
  icon?: MenuItem['icon']
}) {
  return (
    <DropdownMenuItem>
      <HostPrefixedLink
        href={href}
        className="flex flex-row items-center gap-2"
      >
        <MenuIcon icon={icon} />
        {title}
      </HostPrefixedLink>
    </DropdownMenuItem>
  )
}

function MenuItem({ item }: { item: MenuItem }) {
  if (item.items) {
    return <HasChildItems item={item} />
  }

  return (
    <SingleItemDropdown href={item.href} title={item.title} icon={item.icon} />
  )
}

function HasChildItems({ item }: { item: MenuItem }) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="flex flex-row items-center gap-2">
        <MenuIcon icon={item.icon} />
        {item.title}
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          {getFilteredMenuItems(item.items).map((childItem) => (
            <MenuItem key={childItem.href} item={childItem} />
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  )
}
