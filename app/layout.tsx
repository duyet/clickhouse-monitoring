import type { Metadata, Viewport } from 'next'

import { Analytics } from '@vercel/analytics/react'
import Script from 'next/script'
import { ThemeProvider } from 'next-themes'
import { Suspense } from 'react'

import '@/app/globals.css'

import { AppProvider } from '@/app/context'
import { SkipLink } from '@/components/accessibility'
import {
  AnalyticsConsentBanner,
  AnalyticsProvider,
} from '@/components/analytics'
import { AppSidebar } from '@/components/app-sidebar'
import { KeyboardShortcuts } from '@/components/controls/keyboard-shortcuts'
import { HeaderActions } from '@/components/header/header-actions'
import { Breadcrumb } from '@/components/navigation/breadcrumb'
import { ResizableSidebarProvider } from '@/components/resizable-sidebar-provider'
import { NetworkStatusBanner } from '@/components/status/network-status-banner'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/sonner'
import { TimezoneProvider } from '@/lib/context/timezone-context'
import { HostProvider, SWRProvider } from '@/lib/swr'

const GA_ANALYTICS_ENABLED = Boolean(process.env.NEXT_PUBLIC_MEASUREMENT_ID)
const SELINE_ENABLED = process.env.NEXT_PUBLIC_SELINE_ENABLED === 'true'
const VERCEL_ANALYTICS_ENABLED =
  process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED === 'true'

export const metadata: Metadata = {
  title: {
    default: 'ClickHouse Monitoring - Real-time Performance Dashboard',
    template: '%s | ClickHouse Monitor',
  },
  description:
    'Real-time monitoring dashboard for ClickHouse clusters. Track query performance, system metrics, merge operations, and replication status with interactive charts and detailed insights.',
  keywords: [
    'ClickHouse',
    'monitoring',
    'dashboard',
    'performance',
    'database',
    'analytics',
    'real-time',
  ],
  authors: [{ name: 'ClickHouse Monitor' }],
  creator: 'ClickHouse Monitor',
  publisher: 'ClickHouse Monitor',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== 'undefined'
        ? window.location.origin
        : 'https://example.com')
  ),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'ClickHouse Monitoring - Real-time Performance Dashboard',
    description:
      'Real-time monitoring dashboard for ClickHouse clusters. Track query performance, system metrics, merge operations, and replication status.',
    siteName: 'ClickHouse Monitor',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ClickHouse Monitoring Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ClickHouse Monitoring - Real-time Performance Dashboard',
    description:
      'Real-time monitoring dashboard for ClickHouse clusters. Track query performance, system metrics, merge operations, and replication status.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TimezoneProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SWRProvider>
          <Suspense fallback={null}>
            <HostProvider>
              <AppProvider reloadIntervalSecond={120}>{children}</AppProvider>
            </HostProvider>
          </Suspense>
        </SWRProvider>
      </ThemeProvider>
    </TimezoneProvider>
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

// JSON-LD structured data for search engines
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'ClickHouse Monitoring',
  description:
    'Real-time monitoring dashboard for ClickHouse clusters. Track query performance, system metrics, merge operations, and replication status.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  browserRequirements: 'Requires JavaScript',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Real-time query monitoring',
    'System metrics dashboard',
    'Merge operation tracking',
    'Replication status monitoring',
    'Performance analytics',
    'Multi-host support',
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased bg-background">
        <Providers>
          <AnalyticsProvider>
            <SkipLink />
            <NetworkStatusBanner />
            <Suspense fallback={null}>
              <KeyboardShortcuts />
            </Suspense>
            <ResizableSidebarProvider defaultOpen={false}>
              <AppSidebar />
              <SidebarInset className="min-w-0 overflow-hidden">
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
                <div
                  id="main-content"
                  className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0"
                  tabIndex={-1}
                >
                  {children}
                </div>
              </SidebarInset>
            </ResizableSidebarProvider>
            <Toaster />
            <Suspense fallback={null}>
              <AnalyticsConsentBanner />
            </Suspense>
          </AnalyticsProvider>
        </Providers>
        <AnalyticsScripts />
      </body>
    </html>
  )
}
