import { HealthCard } from './health-card'
import { HEALTH_CHECKS } from './health-checks'
import { RunningMutationsCard, StuckMutationsCard } from './mutations-cards'
import { useEffect, useState } from 'react'
import { loadThresholds } from '@/lib/health/thresholds-storage'

export function HealthGrid() {
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

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {HEALTH_CHECKS.map((check) => (
        <HealthCard
          key={check.id}
          check={check}
          thresholds={overrides[check.id] ?? check.defaults}
        />
      ))}
      <RunningMutationsCard />
      <StuckMutationsCard />
    </div>
  )
}
