import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Menu from '@/components/menu'

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
    <html lang='en'>
      <body className={inter.className}>
        <div className='hidden h-full flex-1 flex-col space-y-8 p-8 md:flex'>
          <div className='flex items-center justify-between space-y-2'>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>ClickHouse Monitoring</h2>
              <p className='text-muted-foreground'></p>
            </div>
            <div className='flex items-center space-x-2'>
              <Menu />
            </div>
          </div>
          {children}
        </div>
      </body>
    </html>
  )
}
