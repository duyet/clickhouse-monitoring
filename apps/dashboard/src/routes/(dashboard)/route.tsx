import { createFileRoute, Outlet } from '@tanstack/react-router'

import { FirstRunGate } from '@/components/host/first-run-gate'
import { DashboardShell } from '@/components/layout/dashboard-shell'

// Pathless `(dashboard)` group = the TanStack equivalent of the Next app's
// app/(dashboard) segment. Renders the shared app chrome (sidebar + header +
// breadcrumb + floating agent) around the routed page, gated by FirstRunGate
// (mirrors app/(dashboard)/layout.tsx).
export const Route = createFileRoute('/(dashboard)')({
  component: DashboardLayout,
})

function DashboardLayout() {
  return (
    <DashboardShell>
      <FirstRunGate>
        <Outlet />
      </FirstRunGate>
    </DashboardShell>
  )
}
