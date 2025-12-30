import { Analytics } from '@vercel/analytics/react'
import type { Metadata } from 'next'
import Script from 'next/script'
import { Suspense } from 'react'

import '@/app/globals.css'

import { AppProvider } from '@/app/context'
import { SWRProvider } from '@/lib/swr'
import { Breadcrumb } from '@/components/breadcrumb'
import { HeaderClient } from '@/components/header-client'
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts'
import { Toaster } from '@/components/ui/sonner'
import { LayoutErrorBoundary } from '@/components/layout-error-boundary'
import { NetworkStatusBanner } from '@/components/network-status-banner'
import { PageSkeleton } from '@/components/page-skeleton'

const GA_ANALYTICS_ENABLED = Boolean(process.env.NEXT_PUBLIC_MEASUREMENT_ID)
const SELINE_ENABLED = process.env.NEXT_PUBLIC_SELINE_ENABLED === 'true'
const VERCEL_ANALYTICS_ENABLED =
  process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED === 'true'

export const metadata: Metadata = {
  title: 'ClickHouse Monitoring',
  description: 'Simple UI for ClickHouse Monitoring',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SWRProvider>
          <AppProvider reloadIntervalSecond={120}>
            <NetworkStatusBanner />
            <Suspense fallback={null}>
              <KeyboardShortcuts />
            </Suspense>
            <div className="min-h-screen flex flex-col bg-background">
              <Suspense
                fallback={
                  <div className="sticky top-0 z-50 flex flex-col border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
                    <div className="flex h-12 items-center px-4 md:px-6 lg:px-8">
                      <div className="flex h-6 w-6 animate-shimmer rounded bg-accent/50" />
                      <div className="ml-3 flex items-center gap-1.5">
                        <div className="h-4 w-8 animate-shimmer rounded bg-accent/50" />
                        <span className="text-muted-foreground/40">/</span>
                        <div className="h-4 w-24 animate-shimmer rounded bg-accent/50" />
                      </div>
                    </div>
                    <div className="flex h-10 items-center gap-2 border-t px-4 md:px-6 lg:px-8">
                      <div className="h-3 w-16 animate-shimmer rounded bg-accent/50" />
                      <div className="h-3 w-14 animate-shimmer rounded bg-accent/50" />
                      <div className="hidden h-3 w-12 animate-shimmer rounded bg-accent/50 sm:block" />
                    </div>
                  </div>
                }
              >
                <HeaderClient />
              </Suspense>
              <main className="flex-1 w-full max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
                <Suspense fallback={<div className="h-5" />}>
                  <Breadcrumb className="mb-3 sm:mb-4" />
                </Suspense>
                <Suspense fallback={<PageSkeleton />}>
                  <LayoutErrorBoundary>
                    {children}
                  </LayoutErrorBoundary>
                </Suspense>
              </main>
            </div>
          </AppProvider>

          <Toaster />
        </SWRProvider>

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
