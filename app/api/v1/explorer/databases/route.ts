/**
 * Explorer databases endpoint
 * GET /api/v1/explorer/databases?hostId=0
 */

import { createTableQueryHandler } from '@/lib/api/handlers'

export const dynamic = 'force-dynamic'

export const GET = createTableQueryHandler({
  route: '/api/v1/explorer/databases',
  queryConfigName: 'explorer-databases',
})
