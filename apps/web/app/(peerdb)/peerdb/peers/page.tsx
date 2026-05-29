'use client'

import type {
  ListMirrorsResponse,
  ListPeersResponse,
  PeerListItem,
} from '@/lib/peerdb/types'

import { PeerGraph } from '@/components/peerdb/peer-graph'
import { PeerTypeIcon } from '@/components/peerdb/peer-type-icon'
import { PeerDBConnectionStatus } from '@/components/peerdb/peerdb-connection-status'
import { PeerDBNotConfigured } from '@/components/peerdb/peerdb-not-configured'
import {
  dbTypeLabel,
  isPeerDBNotConfigured,
} from '@/components/peerdb/peerdb-utils'
import { AppLink } from '@/components/ui/app-link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePeerDB } from '@/lib/swr'

export default function PeerDBPeersPage() {
  const peersReq = usePeerDB<ListPeersResponse>('/peers/list', {
    refreshInterval: 60_000,
  })
  const mirrorsReq = usePeerDB<ListMirrorsResponse>('/mirrors/list', {
    refreshInterval: 60_000,
  })

  // PeerDB returns `items` plus split source/destination lists; merge + dedupe.
  // Memoized so PeerGraph's dagre layout only recomputes when the data changes,
  // not on every render (which would reset node positions and the viewport).
  const peers = (() => {
    const seen = new Map<string, PeerListItem>()
    for (const p of [
      ...(peersReq.data?.items ?? []),
      ...(peersReq.data?.sourceItems ?? []),
      ...(peersReq.data?.destinationItems ?? []),
    ]) {
      if (p?.name && !seen.has(p.name)) seen.set(p.name, p)
    }
    return Array.from(seen.values())
  })()
  const mirrors = mirrorsReq.data?.mirrors ?? []

  if (isPeerDBNotConfigured(peersReq.error)) {
    return <PeerDBNotConfigured />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">PeerDB Peers</h1>
          <p className="text-sm text-muted-foreground">
            Source and destination peers and the mirrors that connect them.
          </p>
        </div>
        <PeerDBConnectionStatus />
      </div>

      <PeerGraph peers={peers} mirrors={mirrors} className="h-[460px]" />

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Peer</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {peers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  {peersReq.isLoading ? 'Loading peers…' : 'No peers found.'}
                </TableCell>
              </TableRow>
            ) : (
              peers.map((p) => (
                <TableRow key={p.name}>
                  <TableCell>
                    <AppLink
                      href={`/peerdb/peer?name=${encodeURIComponent(p.name)}`}
                      className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
                    >
                      <PeerTypeIcon type={p.type} />
                      {p.name}
                    </AppLink>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {dbTypeLabel(p.type)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
