'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ReloadIcon } from '@radix-ui/react-icons'
import { useInterval } from 'usehooks-ts'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAppContext } from '@/app/context'

interface ReloadButtonProps {
  className?: string
}

export function ReloadButton({ className }: ReloadButtonProps) {
  const router = useRouter()
  const [isLoading, startTransition] = useTransition()
  const { reloadInterval } = useAppContext()

  const refreshRouter = () => {
    startTransition(() => router.refresh())
  }

  const onClickReload = refreshRouter

  useInterval(refreshRouter, reloadInterval)

  return (
    <Button
      variant="outline"
      className={cn('ml-auto', className)}
      onClick={onClickReload}
    >
      <ReloadIcon className={cn('h-4 w-4', isLoading ? 'animate-spin' : '')} />
    </Button>
  )
}
