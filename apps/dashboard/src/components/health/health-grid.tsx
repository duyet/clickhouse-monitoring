import { HealthCard } from './health-card'
import { HEALTH_CHECKS } from './health-checks'
import { RunningMutationsCard, StuckMutationsCard } from './mutations-cards'
import { EMPTY_STATE, useHealthChecks } from './use-health-checks'
import { useEffect, useMemo, useState } from 'react'
import { loadThresholds } from '@/lib/health/thresholds-storage'
import { useHostId } from '@/lib/swr'

const STUCK_MUTATIONS_CHART = 'summary-stuck-mutations'
const RUNNING_MUTATIONS_CHART = 'summary-used-by-mutations'

export function HealthGrid() {
  const hostId = useHostId()
  const [overrides, setOverrides] = useState<
    Record<string, { warning: number; critical: number }>
  >({})

  useEffect(() => {
    setOverrides(loadThresholds())
    const handler = () => setOverrides(loadThresholds())
    window.addEventListener('health-thresholds-changed', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('health-thresholds-changed', handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  // Every card's chart name, fetched together in one request.
  const chartNames = useMemo(
    () => [
      ...HEALTH_CHECKS.map((c) => c.chartName),
      STUCK_MUTATIONS_CHART,
      RUNNING_MUTATIONS_CHART,
    ],
    []
  )

  const { results, isLoading } = useHealthChecks(chartNames, hostId)

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {HEALTH_CHECKS.map((check) => (
        <HealthCard
          key={check.id}
          check={check}
          thresholds={overrides[check.id] ?? check.defaults}
          hostId={hostId}
          result={results[check.chartName] ?? EMPTY_STATE}
          isLoading={isLoading}
        />
      ))}
      <RunningMutationsCard
        hostId={hostId}
        result={results[RUNNING_MUTATIONS_CHART] ?? EMPTY_STATE}
        isLoading={isLoading}
      />
      <StuckMutationsCard
        hostId={hostId}
        result={results[STUCK_MUTATIONS_CHART] ?? EMPTY_STATE}
        isLoading={isLoading}
      />
    </div>
  )
}
