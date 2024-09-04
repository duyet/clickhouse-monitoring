'use client'

import { cn, getHost } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { Suspense } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'

export function ClickHouseHostSelector({
  configs,
  currentHostId,
}: {
  currentHostId: string
  configs: {
    host: string
    id: string
    customName?: string
    promise: UptimePromise
  }[]
}) {
  const router = useRouter()
  const current = configs[parseInt(currentHostId)]

  return (
    <div>
      <Select
        onValueChange={(val) => {
          if (typeof window !== 'undefined') {
            document.cookie = `hostId=${val}; path=/`
          }
          router.push(`/${val}/overview`)
        }}
      >
        <SelectTrigger className="border-0 p-1 shadow-none">
          <div className="flex items-center gap-2">
            <SelectValue
              placeholder={current.customName || current.host}
              defaultValue={current.id}
            />
          </div>
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

type UptimePromise = Promise<{
  uptime: string
  hostName: string
  version: string
} | null>

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
