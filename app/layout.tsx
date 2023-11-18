import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import '@/app/globals.css'

import { Header } from '@/components/header'
import { AppProvider } from '@/app/context'

const inter = Inter({ subsets: ['latin'] })

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
          <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <Header />
            {children}
          </div>
        </AppProvider>
      </body>
    </html>
  )
}
