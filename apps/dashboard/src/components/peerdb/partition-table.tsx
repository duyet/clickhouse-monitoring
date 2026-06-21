import type { QRepPartition } from '@/lib/peerdb/types'

import { durationMs, formatDateTime, toNumber } from './peerdb-utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatReadableQuantity } from '@/lib/format-readable'
import { formatDuration } from '@/lib/utils'

interface PartitionTableProps {
  partitions: QRepPartition[]
}

/**
 * QRep / initial-load partition detail, exactly the columns the user asked for:
 * Partition UUID · Duration · Start Time · End Time · Rows In Partition · Rows
 * Synced. Duration is derived from start→end (or pullEnd) timestamps.
 */
export function PartitionTable({ partitions }: PartitionTableProps) {
  if (partitions.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No partitions found for this mirror.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Partition UUID</TableHead>
            <TableHead className="text-right">Duration</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead className="text-right">Rows In Partition</TableHead>
            <TableHead className="text-right">Rows Synced</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {partitions.map((p, index) => {
            const end = p.endTime ?? p.pullEndTime
            const duration = durationMs(p.startTime, end)
            const rowsIn = toNumber(p.rowsInPartition ?? p.numRows)
            const rowsSynced = toNumber(p.rowsSynced)
            return (
              <TableRow key={p.partitionId ?? index}>
                <TableCell className="font-mono text-xs">
                  {p.partitionId ?? '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {duration === null ? '—' : formatDuration(duration)}
                </TableCell>
                <TableCell className="text-xs">
                  {formatDateTime(p.startTime)}
                </TableCell>
                <TableCell className="text-xs">{formatDateTime(end)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatReadableQuantity(rowsIn)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatReadableQuantity(rowsSynced)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
