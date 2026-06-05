#!/usr/bin/env bun

import { createClickHouseConversationsTableSql } from '../apps/dashboard/lib/conversation-store/clickhouse-store'
import { getClient } from '@chm/clickhouse-client'

const database = process.env.CLICKHOUSE_DATABASE || 'system'
const table =
  process.env.CLICKHOUSE_AGENT_CONVERSATIONS_TABLE ||
  `${database}.agent_conversations`

async function main() {
  const client = await getClient({
    hostId: Number(process.env.CLICKHOUSE_AGENT_CONVERSATIONS_HOST_ID || 0),
  })
  const sql = createClickHouseConversationsTableSql(table)
  await client.command({ query: sql })
  console.log(`Created or verified ClickHouse table: ${table}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
