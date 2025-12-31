import { Analytics } from '@vercel/analytics/react'
import type { Metadata } from 'next'
import Script from 'next/script'
import { ThemeProvider } from 'next-themes'
import { Suspense } from 'react'

import '@/app/globals.css'

import { AppProvider } from '@/app/context'
import { KeyboardShortcuts } from '@/components/controls/keyboard-shortcuts'
import { LayoutErrorBoundary } from '@/components/feedback/layout-error-boundary'
import { SidebarLayout } from '@/components/layout/sidebar-layout'
import { PageSkeleton, SidebarSkeleton } from '@/components/skeletons'
import { NetworkStatusBanner } from '@/components/status/network-status-banner'
import { Toaster } from '@/components/ui/sonner'
import { SWRProvider } from '@/lib/swr'

const GA_ANALYTICS_ENABLED = Boolean(process.env.NEXT_PUBLIC_MEASUREMENT_ID)
const SELINE_ENABLED = process.env.NEXT_PUBLIC_SELINE_ENABLED === 'true'
const VERCEL_ANALYTICS_ENABLED =
  process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED === 'true'

export const metadata: Metadata = {
  title: 'ClickHouse Monitoring',
  description: 'Simple UI for ClickHouse Monitoring',
}

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SWRProvider>
        <AppProvider reloadIntervalSecond={120}>{children}</AppProvider>
      </SWRProvider>
    </ThemeProvider>
  )
}

function AnalyticsScripts() {
  return (
    <>
      {VERCEL_ANALYTICS_ENABLED && <Analytics />}
      {SELINE_ENABLED && <Script src="https://cdn.seline.so/seline.js" async />}
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
    </>
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
        <Providers>
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
          <Toaster />
        </Providers>
        <AnalyticsScripts />
      </body>
    </html>
  )
}
