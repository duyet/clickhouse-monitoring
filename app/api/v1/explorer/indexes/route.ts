/**
 * Explorer indexes endpoint
 * GET /api/v1/explorer/indexes?hostId=0&database=default&table=users
 */

import { createTableQueryHandler } from '@/lib/api/handlers'

export const dynamic = 'force-dynamic'

export const GET = createTableQueryHandler({
  route: '/api/v1/explorer/indexes',
  queryConfigName: 'explorer-indexes',
})
