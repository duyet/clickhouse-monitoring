import { createFileRoute, Outlet } from '@tanstack/react-router'

// Pathless `(docs)` layout group — mirrors the Next app's app/(docs) segment.
// The docs section uses the same root providers (ClerkAuthProvider, ThemeProvider, etc.)
// already mounted by __root.tsx, so this layout only wraps the content area.
export const Route = createFileRoute('/(docs)')({
  component: DocsLayout,
})

function DocsLayout() {
  return (
    <div className="antialiased">
      <Outlet />
    </div>
  )
}
