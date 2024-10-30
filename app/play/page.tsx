'use client'

import { AreaChart } from '@/components/generic-charts/area'
import { useToast } from '@/components/ui/use-toast'

export default function Play() {
  const { toast } = useToast()

  const data = [
    {
      date: '2025-01-01',
      A: 1000,
      B: 2000,
      C: 501,
      readable_A: 'one hundred',
    },
    {
      date: '2025-02-01',
      A: 6411,
      B: 1241,
      C: 8210,
      readable_A: 'six hundred and forty one',
    },
    {
      date: '2025-03-01',
      A: 2314,
      B: 121,
      C: 1249,
      readable_A: 'two hundred and thirty one',
    },
    {
      date: '2025-04-01',
      A: 5314,
      B: 221,
      C: 219,
      readable_A: 'two hundred and thirty one',
    },
  ]

  return (
    <>
      {/* <TableSkeleton />
      <TableSkeleton cols={5} />
      <ErrorAlert message="Error message" query="SELECT 1" />
      <SingleLineSkeleton />
      <SingleLineSkeleton className="w-[300px]" />
      <SingleLineSkeleton className="w-[200px] space-x-0 pt-0" />

      <hr />
      <div>
        MultiLineSkeleton
        <MultiLineSkeleton />
      </div>

      <Button
        variant="outline"
        onClick={() => {
          toast({
            title: 'Uh oh! Something went wrong.',
            description: 'There was a problem with your request.',
            action: <ToastAction altText="Try again">Try again</ToastAction>,
          })
        }}
      >
        Hello
      </Button> */}

      <div className="h-[400px] w-[400px]">
        <AreaChart data={data} categories={['A']} index="date" showLegend />
      </div>
    </>
  )
}
