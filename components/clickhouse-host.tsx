import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { fetchData, getClickHouseHosts } from '@/lib/clickhouse'
import { getHost } from '@/lib/utils'

const Online = () => (
  <span className="relative flex size-2">
    <span className="absolute inline-flex size-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
    <span className="relative inline-flex size-2 rounded-full bg-sky-500"></span>
  </span>
)

const Offline = () => (
  <span className="relative flex size-2">
    <span className="absolute inline-flex size-full rounded-full bg-red-400"></span>
  </span>
)

const HostStatus = async ({ host }: { host: string }) => {
  let isOnline
  let message
  try {
    const uptime = await fetchData<{ uptime: string }[]>({
      query: 'SELECT formatReadableTimeDelta(uptime()) as uptime',
    })
    const hostName = await fetchData<{ hostName: string }[]>({
      query: 'SELECT hostName() as hostName',
    })

    isOnline = true
    message = `${hostName[0].hostName} online: ${uptime[0].uptime}`
  } catch (e) {
    isOnline = false
    message = `Offline: ${e}`
  }

  return (
    <div className="flex flex-row items-center gap-2" title={message}>
      {getHost(host)}
      {isOnline ? <Online /> : <Offline />}
    </div>
  )
}

export async function ClickHouseHost() {
  const hosts = getClickHouseHosts()

  if (!hosts) return null

  if (hosts.length === 1) {
    return (
      <div className="mt-2">
        <div className="flex flex-row items-center gap-2">
          <HostStatus host={hosts[0]} />
        </div>
      </div>
    )
  }

  return (
    <div className="mt-2">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder={hosts[0]} />
        </SelectTrigger>
        <SelectContent>
          {hosts.map((host) => (
            <SelectItem key={host} value={host}>
              <HostStatus host={host} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
