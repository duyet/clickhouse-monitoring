import Link from 'next/link'

import { QUERY_COMMENT, fetchData } from '@/lib/clickhouse'
import { Badge } from '@/components/ui/badge'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerClasses,
} from '@/components/ui/navigation-menu'

const items = [
  {
    title: 'Overview',
    href: '/',
  },
  {
    title: 'Running Queries',
    href: '/running-queries',
    countSql: `SELECT COUNT() FROM system.processes WHERE is_cancelled = 0 AND query NOT LIKE '%${QUERY_COMMENT}%'`,
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
    href: '/settings',
  },
]

export async function Menu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {items.map((item) => (
          <NavigationMenuItem key={item.href}>
            <Link href={item.href} legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerClasses}>
                {item.title}
                <MenuCounter sql={item.countSql} />
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}

async function MenuCounter({ sql }: { sql?: string }) {
  if (!sql) return null

  const data = await fetchData(sql)
  if (!data || !data.length || !data?.[0]?.['count()']) return null

  const count = data[0]['count()'] || data[0]['count'] || 0
  if (count === 0) return null

  return <Badge className='ml-2' variant='outline'>{count}</Badge>
}
