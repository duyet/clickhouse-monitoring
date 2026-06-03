import { createFileRoute, Outlet } from '@tanstack/react-router'

// Pathless `(dashboard)` group = the TanStack equivalent of the Next app's
// app/(dashboard) segment. Bare layout for the foundation; the real
// sidebar/header/breadcrumb chrome is ported in a later issue.
export const Route = createFileRoute('/(dashboard)')({
  component: DashboardLayout,
})

function DashboardLayout() {
  return (
    <main className="mx-auto max-w-7xl p-6">
      <Outlet />
    </main>
  )
}
