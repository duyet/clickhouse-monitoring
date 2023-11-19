import Image from 'next/image'

import { Menu } from '@/components/menu'
import { ReloadButton } from '@/components/reload-button'

export function Header() {
  return (
    <div className="flex items-center justify-between space-y-2">
      <div>
        <h2 className="flex flex-row items-center text-2xl font-bold tracking-tight min-w-32">
          <Image
            src="/logo.svg"
            width={40}
            height={40}
            alt="Logo"
            className="mr-2"
          />
          <span className="hidden sm:flex">ClickHouse Monitoring</span>
          <span className="flex sm:hidden">Monitoring</span>
        </h2>
        <p className="text-muted-foreground"></p>
      </div>
      <div className="flex items-center space-x-2">
        <Menu />
        <ReloadButton />
      </div>
    </div>
  )
}
