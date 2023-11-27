import Image from 'next/image'

import { ClickHouseHost } from '@/components/clickhouse-host'
import { Menu } from '@/components/menu/menu'
import { ReloadButton } from '@/components/reload-button'

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
          <h2 className="min-w-32 flex flex-col text-2xl font-bold tracking-tight">
            <span className="hidden sm:flex">ClickHouse Monitoring</span>
            <span className="flex sm:hidden">Monitoring</span>
          </h2>
          <p className="text-muted-foreground">
            <ClickHouseHost />
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Menu />
        <ReloadButton />
      </div>
    </div>
  )
}
