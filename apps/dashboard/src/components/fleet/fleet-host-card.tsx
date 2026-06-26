import { useNavigate } from '@tanstack/react-router'

import type { MergedHostInfo } from '@/lib/swr/use-merged-hosts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useHostStatus } from '@/lib/swr/use-host-status'

interface FleetHostCardProps {
  host: MergedHostInfo
}

/** Individual host card for the /fleet overview page. */
export function FleetHostCard({ host }: FleetHostCardProps) {
  const navigate = useNavigate()
  // Browser connections (negative IDs) have no server-side status endpoint.
  const isBrowser = host.id < 0
  const {
    data: status,
    isLoading,
    isOnline,
  } = useHostStatus(isBrowser ? null : host.id)

  const handleView = () => {
    navigate({
      to: '/overview',
      search: (prev) => ({ ...prev, host: host.id }),
    })
  }

  return (
    <Card className="flex flex-col gap-0">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-base leading-snug">
            {host.name || host.host}
          </CardTitle>
          {isBrowser ? (
            <Badge variant="outline" className="shrink-0 text-xs">
              browser
            </Badge>
          ) : isLoading ? (
            <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
          ) : isOnline ? (
            <Badge
              variant="outline"
              className="shrink-0 border-green-500/40 bg-green-500/10 text-xs text-green-700 dark:text-green-400"
            >
              online
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="shrink-0 border-red-500/40 bg-red-500/10 text-xs text-red-700 dark:text-red-400"
            >
              offline
            </Badge>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">{host.host}</p>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        {isBrowser ? (
          <p className="text-xs text-muted-foreground">
            Browser-stored connection — status not available.
          </p>
        ) : isLoading ? (
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        ) : status ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
            <dt className="text-muted-foreground">Version</dt>
            <dd className="truncate font-mono">{status.version}</dd>
            <dt className="text-muted-foreground">Uptime</dt>
            <dd className="truncate">{status.uptime}</dd>
            <dt className="text-muted-foreground">Hostname</dt>
            <dd className="truncate text-muted-foreground">
              {status.hostname}
            </dd>
          </dl>
        ) : (
          <p className="text-xs text-muted-foreground">Unable to reach host.</p>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={handleView}
        >
          View
        </Button>
      </CardFooter>
    </Card>
  )
}
