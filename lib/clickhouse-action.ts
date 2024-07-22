'use server'

import { CLICKHOUSE_CACHE_TAG } from '@/lib/clickhouse-cache'
import { revalidateTag } from 'next/cache'

export const revalidateClickHouse = async () => {
  revalidateTag(CLICKHOUSE_CACHE_TAG)
}
