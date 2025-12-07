'use server'

import { CLICKHOUSE_CACHE_TAG } from '@/lib/clickhouse-cache'
import { revalidateTag } from 'next/cache'

export const revalidateClickHouse = async () => {
  // Next.js 16 requires a cache life profile as second argument
  await revalidateTag(CLICKHOUSE_CACHE_TAG, { expire: 0 })
}
