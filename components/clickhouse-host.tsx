import { fetchData } from '@/lib/clickhouse'
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

export async function ClickHouseHost() {
  const host = process.env.CLICKHOUSE_HOST

  if (!host) return null

  let isOnline
  let message
  try {
    const rows = await fetchData(
      'SELECT formatReadableTimeDelta(uptime()) as uptime'
    )
    isOnline = true
    message = 'Online: ' + (rows?.[0]?.uptime ? `: ${rows[0].uptime}` : '')
  } catch (e) {
    isOnline = false
    message = `Offline: ${e}`
  }

  return (
    <span className="flex flex-row items-center gap-2" title={message}>
      {getHost(host)}
      {isOnline ? <Online /> : <Offline />}
    </span>
  )
}
