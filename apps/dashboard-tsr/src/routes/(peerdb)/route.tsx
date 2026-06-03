import { createFileRoute, Outlet } from '@tanstack/react-router'

// Pathless `(peerdb)` group — mirrors the Next app's app/(peerdb) segment.
// Shares the same bare layout as (dashboard); add a separate sidebar/header
// here later if the two layouts diverge.
export const Route = createFileRoute('/(peerdb)')({
  component: PeerDBLayout,
})

function PeerDBLayout() {
  return (
    <main className="mx-auto max-w-7xl p-6">
      <Outlet />
    </main>
  )
}
