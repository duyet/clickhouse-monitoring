import Image from 'next/image'

import { ClickHouseHost } from '@/components/clickhouse-host'
import { Menu } from '@/components/menu/menu'
import { ReloadButton } from '@/components/reload-button'
import { Suspense } from 'react'
import { SingleLineSkeleton } from './skeleton'

const TITLE = process.env.NEXT_PUBLIC_TITLE || 'ClickHouse Monitoring'
const TITLE_SHORT = process.env.NEXT_PUBLIC_TITLE_SHORT || 'Monitoring'

export function Header() {
  return (
    <div className="flex items-center justify-between space-y-2">
      <div className="flex flex-row items-center">
        <Image
          src="/logo.svg"
          width={40}
          height={40}
          alt="Logo"
          className="mr-2"
        />
        <div>
          <h2 className="flex min-w-32 flex-col text-2xl font-bold tracking-tight">
            <span className="hidden sm:flex">{TITLE}</span>
            <span className="flex sm:hidden">{TITLE_SHORT}</span>
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
