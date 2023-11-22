import React from 'react'
import Link from 'next/link'

import { QUERY_COMMENT } from '@/lib/clickhouse'
import { cn } from '@/lib/utils'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerClasses,
} from '@/components/ui/navigation-menu'
import { CountBadge } from '@/components/count-badge'

interface MenuProps {
  items?: MenuItem[]
}

interface MenuItem {
  title: string
  href: string
  description?: string
  countSql?: string
  items?: MenuItem[]
}

const defaultItems = [
  {
    title: 'Overview',
    href: '/overview',
  },
  {
    title: 'Queries Monitor',
    href: '',
    countSql: `SELECT COUNT() FROM system.processes WHERE is_cancelled = 0 AND query NOT LIKE '%${QUERY_COMMENT}%'`,
    items: [
      {
        title: 'Running Queries',
        href: '/running-queries',
        description: 'Queries that are currently running',
        countSql: `SELECT COUNT() FROM system.processes WHERE is_cancelled = 0 AND query NOT LIKE '%${QUERY_COMMENT}%'`,
      },
      {
        title: 'History Queries',
        href: '/history-queries',
        description:
          'Queries that have been run including successed, failed queries with resourses usage details',
      },
      {
        title: 'Most Expensive Queries',
        href: '/expensive-queries',
        description: 'Most expensive queries in my ClickHouse',
      },
    ],
  },
  {
    title: 'Tables',
    href: '/tables',
    countSql: `SELECT COUNT() FROM system.tables WHERE lower(database) NOT IN ('system', 'information_schema') AND is_temporary = 0 AND engine LIKE '%MergeTree%'`,
  },
  {
    title: 'Merges',
    href: '/merges',
    countSql: `SELECT COUNT() FROM system.merges WHERE 1 = 1`,
  },
  {
    title: 'Settings',
    href: '',
    items: [
      {
        title: 'Settings',
        href: '/settings',
        description:
          'The values of global server settings which can be viewed in the table `system.settings`',
      },
      {
        title: 'MergeTree Settings',
        href: '/mergetree-settings',
        description:
          'The values of merge_tree settings (for all MergeTree tables) which can be viewed in the table `system.merge_tree_settings`',
      },
    ],
  },
]

export function Menu({ items = defaultItems }: MenuProps) {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {items.map((item) => (
          <MenuItem key={item.href} item={item} />
        ))}
      </NavigationMenuList>
    </NavigationMenu>
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
    <NavigationMenuItem>
      <Link href={item.href} legacyBehavior passHref>
        <NavigationMenuLink className={navigationMenuTriggerClasses}>
          {item.title}
          <CountBadge sql={item.countSql} />
        </NavigationMenuLink>
      </Link>
    </NavigationMenuItem>
  )
}

function HasChildItems({ item }: { item: MenuItem }) {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>
        {item.title} <CountBadge sql={item.countSql} />
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-fit min-w-[400px] grid-cols-1 content-center items-stretch gap-2 p-4 md:min-w-[700px] md:grid-cols-2">
          {item.items?.map((childItem) => (
            <ListItem
              key={childItem.href}
              title={
                <span>
                  {childItem.title} <CountBadge sql={childItem.countSql} />
                </span>
              }
              href={childItem.href}
              description={childItem.description}
            />
          ))}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  )
}

function ListItem({
  className,
  title,
  href,
  description,
  ...props
}: {
  className?: string
  title: React.ReactNode
  href: string
  description: React.ReactNode
}) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          className={cn(
            'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors',
            className
          )}
          href={href}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
            {description}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
}
