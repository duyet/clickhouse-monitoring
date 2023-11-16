'use client'

import Link from 'next/link'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'

const items = [
  {
    title: 'Overview',
    href: '/',
  },
  {
    title: 'Running Queries',
    href: '/running-queries',
  },
  {
    title: 'Tables',
    href: '/tables',
  },
  {
    title: 'Merges',
    href: '/merges',
  },
  {
    title: 'Settings',
    href: '/settings',
  },
]

export function Menu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {items.map((item) => (
          <NavigationMenuItem key={item.href}>
            <Link href={item.href} legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                {item.title}
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
