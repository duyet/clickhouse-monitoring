import { type Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'

import '@/app/globals.css'

import { AppProvider } from '@/app/context'
import { Header } from '@/components/header'
import { Toaster } from '@/components/ui/toaster'
import { Suspense } from 'react'
import { Background } from './background'
import { PageView } from './pageview'

const inter = Inter({ subsets: ['latin'] })

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_MEASUREMENT_ID

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
      <body className={inter.className}>
        <AppProvider>
          <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <Header />
            {children}
            <Toaster />
          </div>
        </AppProvider>

        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>

        <Suspense fallback={null}>
          <PageView />
          <Background />
        </Suspense>
      </body>
    </html>
  )
}
