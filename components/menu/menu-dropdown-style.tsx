import { HamburgerMenuIcon } from '@radix-ui/react-icons'

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
import { type MenuItem } from './types'

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
  children,
}: {
  href: string
  title: string
  children: React.ReactNode
}) {
  return (
    <DropdownMenuItem>
      <HostPrefixedLink
        href={href}
        className="flex flex-row items-center gap-2"
      >
        {children}
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
    <SingleItemDropdown href={item.href} title={item.title}>
      {item.icon && <item.icon className="size-3" />}
    </SingleItemDropdown>
  )
}

function HasChildItems({ item }: { item: MenuItem }) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="flex flex-row items-center gap-2">
        {item.icon && <item.icon className="size-3" />}
        {item.title}
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          {item.items?.map((childItem) => (
            <MenuItem key={childItem.href} item={childItem} />
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  )
}
