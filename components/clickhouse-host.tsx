import { fetchData } from '@/lib/clickhouse'
import { getHost } from '@/lib/utils'

const Online = () => (
  <span className="relative flex h-2 w-2">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
    <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500"></span>
  </span>
)

const Offline = () => (
  <span className="relative flex h-2 w-2">
    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400"></span>
  </span>
)

export async function ClickHouseHost() {
  const host = process.env.CLICKHOUSE_HOST

  if (!host) return null

  let isOnline
  let message
  try {
    await fetchData('SELECT 1')
    isOnline = true
    message = 'Online'
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
