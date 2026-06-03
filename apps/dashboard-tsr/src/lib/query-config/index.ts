import type { QueryConfig } from './types'

export type { QueryConfig } from './types'

export { getSqlForDisplay } from './types'

// Flat list of all table QueryConfigs. Empty in the foundation; the per-domain
// configs (54 in the Next app) are a later fan-out. table-registry maps this.
export const queries: QueryConfig[] = []
