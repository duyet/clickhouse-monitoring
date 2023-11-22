import { getHost } from '@/lib/utils'

export function ServerHostname() {
  const host = process.env.CLICKHOUSE_HOST

  return getHost(host)
}
