// Ambient type declarations for optional dependencies.
// These ensure TypeScript compiles even when the packages are not installed.
// The actual modules are resolved at build time via webpack/turbopack aliases
// in next.config.ts (stubbed with lib/stubs/ when missing).

declare module '@vercel/analytics/react' {
  import type { ComponentType } from 'react'
  export const Analytics: ComponentType
}
