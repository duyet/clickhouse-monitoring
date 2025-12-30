import { HamburgerMenuIcon } from '@radix-ui/react-icons'
import { memo } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { menuItemsConfig } from '@/menu'

import { HostPrefixedLink } from './link-with-context'
import type { MenuItem } from './types'

export interface MenuProps {
  items?: MenuItem[]
  className?: string
}

export const MenuDropdownStyle = memo(function MenuDropdownStyle({
  items = menuItemsConfig,
  className,
}: MenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={className}
          aria-label="Open menu"
          aria-haspopup="true"
        >
          <HamburgerMenuIcon className="size-3" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56"
        role="menu"
        aria-label="Navigation menu"
      >
        {items.map((item) => (
          <MenuItemComponent key={item.href} item={item} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

const SingleItemDropdown = memo(function SingleItemDropdown({
  href,
  title,
  children,
}: {
  href: string
  title: string
  children: React.ReactNode
}) {
  return (
    <DropdownMenuItem role="menuitem">
      <HostPrefixedLink
        href={href}
        className="flex flex-row items-center gap-2"
        aria-label={`Navigate to ${title}`}
      >
        {children}
        {title}
      </HostPrefixedLink>
    </DropdownMenuItem>
  )
})

const MenuItemComponent = memo(function MenuItemComponent({
  item,
}: {
  item: MenuItem
}) {
  if (item.items) {
    return <HasChildItems item={item} />
  }

  return (
    <SingleItemDropdown href={item.href} title={item.title}>
      {item.icon && (
        <item.icon className="size-3" strokeWidth={1} aria-hidden="true" />
      )}
    </SingleItemDropdown>
  )
})

const HasChildItems = memo(function HasChildItems({
  item,
}: {
  item: MenuItem
}) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger
        className="flex flex-row items-center gap-2"
        aria-haspopup="true"
      >
        {item.icon && (
          <item.icon className="size-3" strokeWidth={1} aria-hidden="true" />
        )}
        {item.title}
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent
          role="menu"
          aria-label={`${item.title} submenu`}
        >
          {item.items
            ?.filter((childItem) => childItem.title && childItem.href)
            .map((childItem) => (
              <MenuItemComponent key={childItem.href} item={childItem} />
            ))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  )
})
