'use client'

import { createPage } from '@/lib/create-page'
import { zookeeperConfig } from '@/lib/query-config/more/zookeeper'

export default createPage({
  queryConfig: zookeeperConfig,
  title: 'ZooKeeper',
})
