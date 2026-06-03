import type { ReactNode } from 'react'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

// Thin next-themes wrapper matching the Next app's ThemeProvider config.
// next-themes is framework-agnostic (not Next-specific) and this is the same
// lib + version, so dark/light behavior is identical. In SPA mode there's no
// server render, so the usual <html class> hydration mismatch is moot.
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
