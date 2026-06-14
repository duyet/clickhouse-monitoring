import { createFileRoute, Outlet } from '@tanstack/react-router'

import { DashboardShell } from '@/components/layout/dashboard-shell'

// Pathless `(peerdb)` group — mirrors the Next app's app/(peerdb) segment,
// which shares the same chrome as (dashboard) but without the FirstRunGate
// wrapper. Uses the shared DashboardShell so the two stay in sync.
export const Route = createFileRoute('/(peerdb)')({
  component: PeerDBLayout,
})

function PeerDBLayout() {
  return (
    <DashboardShell>
      <Outlet />
    </DashboardShell>
  )
}
