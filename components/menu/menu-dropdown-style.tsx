import Link from 'next/link'
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

import { menuItemsConfig } from './menu-items-config'
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
          <HamburgerMenuIcon className="h-3 w-3" />
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

function MenuItem({ item }: { item: MenuItem }) {
  if (item.items) {
    return <HasChildItems item={item} />
  }

  return <SingleItem item={item} />
}

function SingleItem({ item }: { item: MenuItem }) {
  return (
    <DropdownMenuItem>
      <Link href={item.href}>{item.title}</Link>
    </DropdownMenuItem>
  )
}

function HasChildItems({ item }: { item: MenuItem }) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>{item.title}</DropdownMenuSubTrigger>
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
