/**
 * Explorer projections endpoint
 * GET /api/v1/explorer/projections?hostId=0&database=default&table=users
 */

import { createTableQueryHandler } from '@/lib/api/handlers'

export const dynamic = 'force-dynamic'

export const GET = createTableQueryHandler({
  route: '/api/v1/explorer/projections',
  queryConfigName: 'explorer-projections',
})
