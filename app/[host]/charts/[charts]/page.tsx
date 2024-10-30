import { ChartSkeleton } from '@/components/skeleton'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

interface PageProps {
  params: Promise<{
    charts: string
  }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 30

export default async function Page({ params }: PageProps) {
  const { charts } = await params
  let chartComponents = []
  let props = {}

  for (const chart of decodeURIComponent(charts).split(',')) {
    console.log(`Rendering chart: ${chart}`)
    try {
      chartComponents.push(
        (await import(`@/components/charts/${chart}`)).default
      )
    } catch (e) {
      console.error(`Error rendering chart: ${chart}`, e)
      notFound()
    }
  }

  return (
    <div>
      {chartComponents.map((Chart, i) => (
        <Suspense key={i} fallback={<ChartSkeleton />}>
          <Chart
            key={i}
            className="mb-4 w-full p-0 shadow-none"
            chartClassName="h-64"
            {...props}
          />
        </Suspense>
      ))}
    </div>
  )
}
