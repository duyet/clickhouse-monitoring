import { GitMerge, Wrench } from 'lucide-react'

import type { ComputedMutations } from '@/lib/health/health-status'
import type { RelatedLink } from './health-checks'

import { HealthCardShell } from './health-card-shell'

interface MutationsCardProps {
  hostId: number
  /** Status/value/label resolved upstream in the grid. */
  computed: ComputedMutations
  /** Observed values, oldest first, for the trend sparkline. */
  spark?: number[]
}

const STUCK_LINKS: readonly RelatedLink[] = [
  { label: 'Mutations', href: '/mutations' },
  { label: 'Tables Overview', href: '/tables-overview' },
]

const RUNNING_LINKS: readonly RelatedLink[] = [
  { label: 'Mutations', href: '/mutations' },
  { label: 'Tables Overview', href: '/tables-overview' },
]

export function StuckMutationsCard({
  hostId,
  computed,
  spark,
}: MutationsCardProps) {
  return (
    <HealthCardShell
      icon={Wrench}
      title="Mutations"
      status={computed.status}
      displayValue={computed.value.toLocaleString()}
      sublabel={computed.label}
      spark={spark}
      links={STUCK_LINKS}
      hostId={hostId}
    />
  )
}

export function RunningMutationsCard({
  hostId,
  computed,
  spark,
}: MutationsCardProps) {
  return (
    <HealthCardShell
      icon={GitMerge}
      title="Running Mutations"
      status={computed.status}
      displayValue={computed.value.toLocaleString()}
      sublabel={computed.label}
      spark={spark}
      links={RUNNING_LINKS}
      hostId={hostId}
    />
  )
}
