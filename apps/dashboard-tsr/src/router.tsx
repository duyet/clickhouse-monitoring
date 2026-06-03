import { createRouter as createTanstackRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'

// Shared router factory consumed by both the server and client entries that
// TanStack Start generates. The export MUST be named `getRouter` — Start's
// hydration entry (#tanstack-router-entry → this file) imports `{ getRouter }`.
// The `Register` augmentation makes every route's params/search types
// inferable app-wide.
export function getRouter() {
  return createTanstackRouter({
    routeTree,
    scrollRestoration: true,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
