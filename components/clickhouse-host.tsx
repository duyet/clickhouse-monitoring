import { Suspense } from 'react'

import {
  ClickHouseHostSelector,
  HostStatus,
} from '@/components/clickhouse-host-selector'
import {
  fetchData,
  getClickHouseConfigs,
  getClickHouseHost,
} from '@/lib/clickhouse'
import { getHostId } from '@/lib/server-context'
import { getHost } from '@/lib/utils'

async function fetchHostStatus(hostId: number) {
  try {
    const { data: detail } = await fetchData<
      { uptime: string; hostName: string; version: string }[]
    >(
      {
        query: `
          SELECT
            formatReadableTimeDelta(uptime()) as uptime,
            hostName() as hostName,
            version() as version
        `,
      },
      hostId
    )

    return detail[0]
  } catch (e) {
    return null
  }
}

export async function ClickHouseHost() {
  const configs = getClickHouseConfigs()

  if (!configs) return null

  if (configs.length === 1) {
    return (
      <div className="flex flex-row items-center gap-2">
        {getHost(configs[0].host)}
        <Suspense>
          <HostStatus promise={fetchHostStatus(0)} />
        </Suspense>
      </div>
    )
  }
  const currentHost = getClickHouseHost()

  return (
    <ClickHouseHostSelector
      currentHostId={getHostId()}
      configs={configs.map((c, id) => ({
        id: id.toString(),
        host: c.host,
        customName: c.customName,
        promise: fetchHostStatus(id),
      }))}
    />
  )
}
