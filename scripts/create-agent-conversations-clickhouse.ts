#!/usr/bin/env bun

import { createClickHouseConversationsTableSql } from '../apps/dashboard/lib/conversation-store/clickhouse-store'
import { getClient } from '@chm/clickhouse-client'

const database = process.env.CLICKHOUSE_DATABASE || 'system'
const table =
  process.env.CLICKHOUSE_AGENT_CONVERSATIONS_TABLE ||
  `${database}.agent_conversations`

function resolveHostId(): number {
  const raw = process.env.CLICKHOUSE_AGENT_CONVERSATIONS_HOST_ID
  if (!raw) return 0

  if (!/^\d+$/.test(raw)) {
    throw new Error(
      'CLICKHOUSE_AGENT_CONVERSATIONS_HOST_ID must be a non-negative integer.'
    )
  }

  const hostId = Number.parseInt(raw, 10)
  if (!Number.isInteger(hostId) || hostId < 0) {
    throw new Error(
      'CLICKHOUSE_AGENT_CONVERSATIONS_HOST_ID must be a non-negative integer.'
    )
  }

  return hostId
}

async function main() {
  const client = await getClient({
    hostId: resolveHostId(),
  })
  const sql = createClickHouseConversationsTableSql(table)
  await client.command({ query: sql })
  console.log(`Created or verified ClickHouse table: ${table}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
