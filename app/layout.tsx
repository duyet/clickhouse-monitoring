import { Analytics } from '@vercel/analytics/react'
import type { Metadata } from 'next'
import Script from 'next/script'
import { Suspense } from 'react'

import '@/app/globals.css'

import { AppProvider } from '@/app/context'
import { SWRProvider } from '@/lib/swr'
import { HeaderClient } from '@/components/header-client'
import { Toaster } from '@/components/ui/sonner'

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
      <body className="font-sans">
        <SWRProvider>
          <AppProvider reloadIntervalSecond={120}>
            <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
              <Suspense
                fallback={
                  <div className="flex h-[73px] items-center justify-between">
                    <div className="flex flex-row items-stretch gap-2">
                      <div className="h-[45px] w-[45px] animate-pulse rounded bg-muted" />
                      <div className="flex-auto truncate">
                        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                  </div>
                }
              >
                <HeaderClient />
              </Suspense>
              {children}
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
