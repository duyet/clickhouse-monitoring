'use client'

import { ErrorAlert } from '@/components/error-alert'
import {
  MultiLineSkeleton,
  SingleLineSkeleton,
  TableSkeleton,
} from '@/components/skeleton'
import { Button } from '@/components/ui/button'
import { ToastAction } from '@/components/ui/toast'
import { useToast } from '@/components/ui/use-toast'

export default function Play() {
  const { toast } = useToast()
  return (
    <>
      <TableSkeleton />
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
      </Button>
    </>
  )
}
