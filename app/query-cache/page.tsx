import { PageLayout } from '@/components/layout/page-layout'
import { queryCacheConfig } from '@/lib/query-config/queries/query-cache'

export default function QueryCachePage() {
  return <PageLayout queryConfig={queryCacheConfig} title="Query Cache" />
}
