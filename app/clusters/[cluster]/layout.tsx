import Link from 'next/link'
import { ArrowLeftIcon } from '@radix-ui/react-icons'

import { fetchDataWithCache } from '@/lib/clickhouse'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ErrorAlert } from '@/components/error-alert'

import { config, type Row } from '../config'

interface ClusterListProps {
  params: {
    cluster: string
  }
  children: React.ReactNode
}

export const revalidate = 600

export default async function ClusterTabListLayout({
  params: { cluster },
  children,
}: ClusterListProps) {
  let clusters: Row[] = []

  try {
    // List cluster name
    clusters = await fetchDataWithCache()(config.sql)

    if (!clusters.length) {
      return (
        <ErrorAlert
          title="Message"
          message="No cluster found on system.clusters"
        />
      )
    }
  } catch (e: any) {
    return (
      <ErrorAlert title="Could not getting list of clusters" message={`${e}`} />
    )
  }

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex flex-row justify-between gap-3">
        <div className="flex flex-row gap-3">
          <Link href={`/clusters`}>
            <Button
              variant="outline"
              size="sm"
              className="text-muted-foreground flex flex-row gap-2"
            >
              <ArrowLeftIcon className="size-3" />
              Back to list of clusters
            </Button>
          </Link>
        </div>
      </div>

      <div>
        <Tabs defaultValue={cluster} className="w-full">
          <TabsList className="mb-3">
            {clusters.map(({ cluster, replica_count }) => (
              <TabsTrigger key={cluster} value={cluster} asChild>
                <Link href={`/clusters/${cluster}/count-across-replicas`}>
                  {cluster} ({replica_count}{' '}
                  {replica_count > 1 ? 'replicas' : 'replica'})
                </Link>
              </TabsTrigger>
            ))}
          </TabsList>

          {children}
        </Tabs>
      </div>
    </div>
  )
}
