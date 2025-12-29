'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import { ClickHouseHostSelector } from '@/components/clickhouse-host-selector'
import { Menu } from '@/components/menu/menu'
import { ReloadButton } from '@/components/reload-button'
import { SingleLineSkeleton } from '@/components/skeleton'

const TITLE = process.env.NEXT_PUBLIC_TITLE || 'ClickHouse Monitoring'
const TITLE_SHORT = process.env.NEXT_PUBLIC_TITLE_SHORT || 'Monitoring'
const LOGO = process.env.NEXT_PUBLIC_LOGO || '/logo-bw.svg'

/**
 * Client-side header component for static export.
 * Builds links with host query parameter instead of dynamic route.
 */
export function HeaderClient() {
  const searchParams = useSearchParams()

  const hostId = searchParams.get('host') || '0'

  // Build link with current hostId
  const buildLink = (path: string) => {
    return `${path}?host=${hostId}`
  }

  return (
    <div className="flex items-center justify-between space-y-2">
      <div className="flex flex-row items-stretch gap-2">
        <Link href={buildLink('/overview')} className="flex-none">
          <Image src={LOGO} width={45} height={45} alt="Logo" />
        </Link>
        <div className="flex-auto truncate">
          <h2 className="min-w-32 text-2xl font-bold tracking-tight">
            <Link href={buildLink('/overview')}>
              <span className="hidden truncate sm:flex">{TITLE}</span>
              <span className="flex truncate sm:hidden">{TITLE_SHORT}</span>
            </Link>
          </h2>
          <div className="text-muted-foreground">
            <Suspense
              fallback={
                <SingleLineSkeleton className="w-[100px] space-x-0 pt-0" />
              }
            >
              <ClickHouseHostSelector
                // TODO: fetch host status via API
                currentHostId={Number(hostId)}
                configs={[]} // Will be populated via API call
              />
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
