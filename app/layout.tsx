import { Analytics } from '@vercel/analytics/react'
import type { Metadata } from 'next'
import Script from 'next/script'
import { Suspense } from 'react'

import '@/app/globals.css'

import { AppProvider } from '@/app/context'
import { SWRProvider } from '@/lib/swr'
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts'
import { Toaster } from '@/components/ui/sonner'
import { LayoutErrorBoundary } from '@/components/layout-error-boundary'
import { NetworkStatusBanner } from '@/components/network-status-banner'
import { PageSkeleton } from '@/components/page-skeleton'
import { SidebarLayout } from '@/components/sidebar-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { ThemeProvider } from 'next-themes'

const GA_ANALYTICS_ENABLED = Boolean(process.env.NEXT_PUBLIC_MEASUREMENT_ID)
const SELINE_ENABLED = process.env.NEXT_PUBLIC_SELINE_ENABLED === 'true'
const VERCEL_ANALYTICS_ENABLED =
  process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED === 'true'

export const metadata: Metadata = {
  title: 'ClickHouse Monitoring',
  description: 'Simple UI for ClickHouse Monitoring',
}

function SidebarSkeleton() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar skeleton */}
      <div className="hidden w-64 border-r bg-sidebar p-4 md:block">
        <Skeleton className="mb-4 h-8 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      </div>
      {/* Content skeleton */}
      <div className="flex-1">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="p-6">
          <PageSkeleton />
        </div>
      </div>
    </div>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SWRProvider>
            <AppProvider reloadIntervalSecond={120}>
              <NetworkStatusBanner />
              <Suspense fallback={null}>
                <KeyboardShortcuts />
              </Suspense>
              <Suspense fallback={<SidebarSkeleton />}>
                <SidebarLayout>
                  <Suspense fallback={<PageSkeleton />}>
                    <LayoutErrorBoundary>{children}</LayoutErrorBoundary>
                  </Suspense>
                </SidebarLayout>
              </Suspense>
            </AppProvider>

            <Toaster />
          </SWRProvider>
        </ThemeProvider>

        {VERCEL_ANALYTICS_ENABLED && <Analytics />}
        {SELINE_ENABLED && (
          <Script src="https://cdn.seline.so/seline.js" async />
        )}
        {GA_ANALYTICS_ENABLED && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_MEASUREMENT_ID}`}
            />
            <Script id="google-analytics">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
