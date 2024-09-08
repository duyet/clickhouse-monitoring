'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Suspense } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { ClickHouseConfig } from '@/lib/clickhouse'
import { cn, getHost, removeHostPrefix } from '@/lib/utils'

type UptimePromise = Promise<{
  uptime: string
  hostName: string
  version: string
} | null>

type ClickHouseHostSelectorProps = {
  currentHostId: number
  configs: Array<
    Omit<ClickHouseConfig, 'user' | 'password'> & {
      promise: UptimePromise
    }
  >
}

export function ClickHouseHostSelector({
  currentHostId = 0,
  configs,
}: ClickHouseHostSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const pathnameWithoutPrefix = removeHostPrefix(pathname)

  const current = configs[currentHostId]
  if (!current) {
    return null
  }

  return (
    <div>
      <Select
        onValueChange={(val) => {
          if (typeof window !== 'undefined') {
            document.cookie = `hostId=${val}; path=/`
          }
          router.push(`/${val}/${pathnameWithoutPrefix}`)
        }}
        defaultValue={current.id.toString()}
      >
        <SelectTrigger className="w-auto border-0 p-1 shadow-none focus:ring-0">
          <SelectValue
            placeholder={current.customName || getHost(current.host)}
            className="mr-2 w-fit truncate"
          />
        </SelectTrigger>
        <SelectContent>
          {configs.map((config, id) => (
            <SelectItem key={config.host + id} value={id.toString()}>
              <div className="flex items-center gap-2">
                <span>{config.customName || getHost(config.host)}</span>
                <Suspense
                  fallback={
                    <StatusIndicator title={['']} className="bg-gray-500" />
                  }
                >
                  <HostStatus promise={config.promise} />
                </Suspense>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export async function HostStatus({ promise }: { promise: UptimePromise }) {
  const res = await promise

  const isOnline = res !== null
  if (isOnline) {
    return (
      <StatusIndicator
        className="bg-sky-500"
        title={[
          `Host: ${res.hostName}`,
          `Online: ${res.uptime}`,
          `Version: ${res.version}`,
        ]}
      />
    )
  }

  return <StatusIndicator title={[`The host is offline`]} />
}

const StatusIndicator = ({
  title,
  className,
}: {
  title: string[]
  className?: string
}) => (
  <TooltipProvider delayDuration={0}>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="relative flex size-2 cursor-pointer">
          <span
            className={cn(
              'absolute inline-flex size-full rounded-full bg-red-400',
              className
            )}
          ></span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {title.map((t, i) => (
          <p key={i}>{t}</p>
        ))}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)
