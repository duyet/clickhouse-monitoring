import Script from 'next/script'
import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import 'nextra-theme-docs/style.css'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'

export const metadata = {
  title: 'ClickHouse Monitoring',
  description: 'ClickHouse Monitoring',
}

const navbar = <Navbar logo={<b>ClickHouse Monitoring</b>} />
const footer = <Footer>MIT {new Date().getFullYear()}</Footer>

export default async function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head>
        <Script
          async
          src="https://cdn.seline.so/seline.js"
          data-token="05046b3773d0534"
        />
        <Script
          async
          src="https://cm43x9afh00003b61bdnjgdkj.d.jitsu.com/p.js"
        />
      </Head>
      <body>
        <Layout
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/duyet/clickhouse-monitoring"
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
