import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'

import { ClickHouseHost } from '@/components/clickhouse-host'
import { Menu } from '@/components/menu/menu'
import { ReloadButton } from '@/components/reload-button'
import { SingleLineSkeleton } from '@/components/skeleton'
import { getScopedLink } from '@/lib/scoped-link'

const TITLE = process.env.NEXT_PUBLIC_TITLE || 'ClickHouse Monitoring'
const TITLE_SHORT = process.env.NEXT_PUBLIC_TITLE_SHORT || 'Monitoring'
const LOGO = process.env.NEXT_PUBLIC_LOGO || '/logo-bw.svg'

export function Header() {
  return (
    <div className="flex items-center justify-between space-y-2">
      <div className="flex flex-row items-center">
        <Link href={getScopedLink('/overview')}>
          <Image
            src={LOGO}
            width={45}
            height={45}
            alt="Logo"
            className="mr-2"
          />
        </Link>
        <div>
          <h2 className="flex min-w-32 flex-col text-2xl font-bold tracking-tight">
            <Link href={getScopedLink('/overview')}>
              <span className="hidden sm:flex">{TITLE}</span>
              <span className="flex sm:hidden">{TITLE_SHORT}</span>
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
          <ReloadButton />
        </Suspense>
      </div>
    </div>
  )
}
