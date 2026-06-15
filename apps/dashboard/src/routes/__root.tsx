import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router'

import type { ReactNode } from 'react'

import appCss from '../styles.css?url'
import { ClerkAuthProvider } from '@/components/clerk/clerk-auth-provider'
import { isClerkClientEnabled } from '@/lib/clerk/clerk-client'
import { AppProvider } from '@/lib/context/app-context'
import { BrowserConnectionsProvider } from '@/lib/context/browser-connections-context'
import { TimeRangeProvider } from '@/lib/context/time-range-context'
import { TimezoneProvider } from '@/lib/context/timezone-context'
import { FeaturePermissionsProvider } from '@/lib/feature-permissions/context'
import { UserConnectionsCacheGuard } from '@/lib/hooks/user-connections-cache-guard'
import { QueryProvider } from '@/lib/query/provider'
import { ThemeProvider } from '@/lib/theme/theme-provider'

// Typed global `?host=` search param, declared on the ROOT so every route
// inherits it and useHostId can read it via useSearch({ strict: false }).
// Mirrors the Next app's host parsing (Number() coerce, fall back to 0).
interface RootSearch {
  host: number
}

function validateSearch(search: Record<string, unknown>): RootSearch {
  const raw = search.host
  const parsed = Number(raw)
  return {
    host:
      raw === undefined || raw === null || Number.isNaN(parsed) ? 0 : parsed,
  }
}

export const Route = createRootRoute({
  validateSearch,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'chmonitor — ClickHouse Monitoring' },
      {
        name: 'description',
        content:
          'Real-time insight into ClickHouse clusters via system tables — metrics, query performance and health.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: 'chmonitor — ClickHouse Monitoring' },
      {
        property: 'og:description',
        content:
          'Real-time insight into ClickHouse clusters via system tables — metrics, query performance and health.',
      },
      { property: 'og:image', content: 'https://dash.chmonitor.dev/og/og.png' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { name: 'twitter:card', content: 'summary_large_image' },
      {
        name: 'twitter:image',
        content: 'https://dash.chmonitor.dev/og/og.png',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

// Root renders the full HTML document (the SPA shell in SPA mode). Providers
// mount client-side: ThemeProvider > QueryProvider (TanStack Query).
function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-background font-sans antialiased">
        <ClerkAuthProvider>
          <TimezoneProvider>
            <ThemeProvider>
              <TimeRangeProvider>
                <QueryProvider>
                  {isClerkClientEnabled() ? (
                    <UserConnectionsCacheGuard />
                  ) : null}
                  <BrowserConnectionsProvider>
                    <AppProvider>
                      <FeaturePermissionsProvider>
                        {children}
                      </FeaturePermissionsProvider>
                    </AppProvider>
                  </BrowserConnectionsProvider>
                </QueryProvider>
              </TimeRangeProvider>
            </ThemeProvider>
          </TimezoneProvider>
        </ClerkAuthProvider>
        <Scripts />
      </body>
    </html>
  )
}
