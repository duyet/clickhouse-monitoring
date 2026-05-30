import type { Metadata, Viewport } from 'next'

import Script from 'next/script'
import { ThemeProvider } from 'next-themes'
import { Suspense } from 'react'

import '@/app/globals.css'

import { AppProvider } from '@/app/context'
import { HostProviderFromUrl } from '@/app/host-provider-from-url'
import { PostHogProvider } from '@/components/analytics/posthog-provider'
import { VercelAnalytics } from '@/components/analytics/vercel-analytics'
import { AppSidebar } from '@/components/app-sidebar'
import { GlobalAssistantModal } from '@/components/assistant-ui/global-assistant-modal'
import { ClerkAuthProvider } from '@/components/clerk/clerk-auth-provider'
import { KeyboardShortcuts } from '@/components/controls/keyboard-shortcuts'
import { HeaderActions } from '@/components/header/header-actions'
import { FirstRunGate } from '@/components/host/first-run-gate'
import { Breadcrumb } from '@/components/navigation/breadcrumb'
import { ResizableSidebarProvider } from '@/components/resizable-sidebar-provider'
import { DynamicTitle } from '@/components/status/dynamic-title'
import { NetworkStatusBanner } from '@/components/status/network-status-banner'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/sonner'
import { BrowserConnectionsProvider } from '@/lib/context/browser-connections-context'
import { TimeRangeProvider } from '@/lib/context/time-range-context'
import { TimezoneProvider } from '@/lib/context/timezone-context'
import { FeaturePermissionsProvider } from '@/lib/feature-permissions/context'
import { SWRProvider } from '@/lib/swr'

const GA_ANALYTICS_ENABLED = Boolean(process.env.NEXT_PUBLIC_MEASUREMENT_ID)
const SELINE_ENABLED = process.env.NEXT_PUBLIC_SELINE_ENABLED === 'true'

export const metadata: Metadata = {
  title: 'chmonitor',
  description: 'Simple UI for chmonitor',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider>
      <TimezoneProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TimeRangeProvider>
            <SWRProvider>
              <BrowserConnectionsProvider>
                <Suspense fallback={null}>
                  <HostProviderFromUrl>
                    <AppProvider reloadIntervalSecond={120}>
                      <FeaturePermissionsProvider>
                        {children}
                      </FeaturePermissionsProvider>
                    </AppProvider>
                  </HostProviderFromUrl>
                </Suspense>
              </BrowserConnectionsProvider>
            </SWRProvider>
          </TimeRangeProvider>
        </ThemeProvider>
      </TimezoneProvider>
    </PostHogProvider>
  )
}

function AnalyticsScripts() {
  return (
    <>
      {process.env.NEXT_PUBLIC_VERCEL_ANALYTICS === 'true' && (
        <VercelAnalytics />
      )}
      {SELINE_ENABLED && (
        <Script src="https://cdn.seline.so/seline.js" strategy="lazyOnload" />
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
        <ClerkAuthProvider>
          <Providers>
            <DynamicTitle />
            <NetworkStatusBanner />
            <Suspense fallback={null}>
              <KeyboardShortcuts />
            </Suspense>
            <ResizableSidebarProvider defaultOpen={true}>
              <AppSidebar />
              <SidebarInset className="min-w-0 overflow-hidden">
                <header className="relative z-10 flex min-h-16 shrink-0 flex-wrap items-center gap-x-2 gap-y-2 transition-[width,height] ease-linear sm:h-16 sm:flex-nowrap sm:group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 sm:group-has-data-[collapsible=icon]/sidebar-wrapper:min-h-12">
                  <div className="flex min-w-0 flex-1 items-center gap-2 px-4 pt-3 sm:pt-0">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Suspense fallback={<Skeleton className="h-4 w-32" />}>
                      <Breadcrumb className="min-w-0" />
                    </Suspense>
                  </div>
                  <div className="w-full min-w-0 overflow-x-auto px-4 pb-3 sm:ml-auto sm:w-auto sm:overflow-visible sm:pb-0">
                    <HeaderActions />
                  </div>
                </header>
                <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto p-3 pt-0 sm:gap-4 sm:p-4 sm:pt-0">
                  <FirstRunGate>{children}</FirstRunGate>
                </div>
              </SidebarInset>
            </ResizableSidebarProvider>
            <GlobalAssistantModal />
            <Toaster />
          </Providers>
        </ClerkAuthProvider>
        <AnalyticsScripts />
      </body>
    </html>
  )
}
