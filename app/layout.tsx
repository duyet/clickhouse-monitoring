import { Analytics } from '@vercel/analytics/react'
import type { Metadata } from 'next'
import Script from 'next/script'
import { ThemeProvider } from 'next-themes'
import { Suspense } from 'react'

import '@/app/globals.css'

import { AppProvider } from '@/app/context'
import { AppSidebar } from '@/components/app-sidebar'
import { KeyboardShortcuts } from '@/components/controls/keyboard-shortcuts'
import { LayoutErrorBoundary } from '@/components/feedback/layout-error-boundary'
import { HeaderActions } from '@/components/header/header-actions'
import { Breadcrumb } from '@/components/navigation/breadcrumb'
import { PageSkeleton, SidebarSkeleton } from '@/components/skeletons'
import { NetworkStatusBanner } from '@/components/status/network-status-banner'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { SWRProvider } from '@/lib/swr'
import { Skeleton } from '@/components/ui/skeleton'

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
      <body className="font-sans antialiased bg-background">
        <Providers>
          <NetworkStatusBanner />
          <Suspense fallback={null}>
            <KeyboardShortcuts />
          </Suspense>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                  <Suspense fallback={<Skeleton className="h-4 w-32" />}>
                    <Breadcrumb />
                  </Suspense>
                </div>
                <div className="ml-auto px-4">
                  <HeaderActions />
                </div>
              </header>
              <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
          <Toaster />
        </Providers>
        <AnalyticsScripts />
      </body>
    </html>
  )
}
