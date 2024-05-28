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

import { fetchData, getClickHouseHosts } from '@/lib/clickhouse'
import { getHost } from '@/lib/utils'
import { Suspense } from 'react'

const Online = ({ title }: { title: string }) => (
  <TooltipProvider delayDuration={0}>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="relative flex size-2 cursor-pointer">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
          <span className="relative inline-flex size-2 rounded-full bg-sky-500"></span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{title}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

const Offline = ({ title }: { title: string }) => (
  <TooltipProvider delayDuration={0}>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="relative flex size-2 cursor-pointer">
          <span className="absolute inline-flex size-full rounded-full bg-red-400"></span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{title}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

const HostStatus = async () => {
  let isOnline
  let title
  try {
    const uptime = await fetchData<{ uptime: string }[]>({
      query: 'SELECT formatReadableTimeDelta(uptime()) as uptime',
    })
    const hostName = await fetchData<{ hostName: string }[]>({
      query: 'SELECT hostName() as hostName',
    })

    isOnline = true
    title = `${hostName[0].hostName} online: ${uptime[0].uptime}`
  } catch (e) {
    isOnline = false
    title = `Offline: ${e}`
  }

  return isOnline ? <Online title={title} /> : <Offline title={title} />
}

export async function ClickHouseHost() {
  const hosts = getClickHouseHosts()

  if (!hosts) return null

  if (hosts.length === 1) {
    return (
      <div className="flex flex-row items-center gap-2">
        {getHost(hosts[0])}
        <Suspense>
          <HostStatus />
        </Suspense>
      </div>
    )
  }

  return (
    <div>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder={hosts[0]} />
        </SelectTrigger>
        <SelectContent>
          {hosts.map((host) => (
            <SelectItem key={host} value={host}>
              <div className="flex flex-row items-center gap-2">
                {getHost(host)}
                <Suspense>
                  <HostStatus />
                </Suspense>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
