'use client'

import { PageLayout } from '@/components/layout/query-page'
import { zookeeperConfig } from '@/lib/query-config/more/zookeeper'

export default function ZookeeperPage() {
  return <PageLayout queryConfig={zookeeperConfig} title="ZooKeeper" />
}
