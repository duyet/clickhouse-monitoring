import { notFound } from 'next/navigation'

interface PageProps {
  params: {
    chart: string
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 30

export default async function Page({ params: { chart } }: PageProps) {
  let Chart
  let props = {}

  try {
    Chart = (await import(`@/components/charts/${chart}`)).default
  } catch (e) {
    return notFound()
  }

  return (
    <Chart
      className="w-full p-0 shadow-none"
      chartClassName="h-96"
      {...props}
    />
  )
}
