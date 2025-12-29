import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'

import { ClickHouseHost } from '@/components/clickhouse-host'
import { Menu } from '@/components/menu/menu'
import { ReloadButton } from '@/components/reload-button'
import { SingleLineSkeleton } from '@/components/skeleton'
import { ThemeToggle } from '@/components/theme-toggle'
import { getScopedLink } from '@/lib/scoped-link'

const TITLE = process.env.NEXT_PUBLIC_TITLE || 'ClickHouse Monitoring'
const TITLE_SHORT = process.env.NEXT_PUBLIC_TITLE_SHORT || 'Monitoring'
const LOGO = process.env.NEXT_PUBLIC_LOGO || '/logo-bw.svg'

export async function Header() {
  return (
    <div className="flex items-center justify-between space-y-2">
      <div className="flex flex-row items-stretch gap-2">
        <Link href={await getScopedLink('/overview')} className="flex-none">
          <Image src={LOGO} width={45} height={45} alt="Logo" />
        </Link>
        <div className="flex-auto truncate">
          <h2 className="min-w-32 text-xl font-bold tracking-tight sm:text-2xl">
            <Link href={await getScopedLink('/overview')}>
              <span className="hidden truncate sm:flex">{TITLE}</span>
              <span className="flex truncate sm:hidden">{TITLE_SHORT}</span>
            </Link>
          </h2>
          <div className="text-muted-foreground">
            <Suspense>
              <ClickHouseHost />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Suspense
          fallback={<SingleLineSkeleton className="w-[200px] space-x-0 pt-0" />}
        >
          <Menu />
          <ThemeToggle />
          <ReloadButton />
        </Suspense>
      </div>
    </div>
  )
}
