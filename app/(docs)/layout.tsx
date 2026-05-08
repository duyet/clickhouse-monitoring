import type { Metadata, Viewport } from 'next'

import Script from 'next/script'
import { ThemeProvider } from 'next-themes'

import '@/app/globals.css'

import { PostHogProvider } from '@/components/analytics/posthog-provider'
import { VercelAnalytics } from '@/components/analytics/vercel-analytics'

const GA_ANALYTICS_ENABLED = Boolean(process.env.NEXT_PUBLIC_MEASUREMENT_ID)
const SELINE_ENABLED = process.env.NEXT_PUBLIC_SELINE_ENABLED === 'true'

export const metadata: Metadata = {
  title: 'ClickHouse Monitoring Docs',
  description: 'ClickHouse Monitoring documentation',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

function DocsProviders({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
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

export default function DocsRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background font-sans antialiased">
        <DocsProviders>{children}</DocsProviders>
        <AnalyticsScripts />
      </body>
    </html>
  )
}
