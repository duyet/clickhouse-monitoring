'use client'

import { ReloadIcon } from '@radix-ui/react-icons'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { useInterval } from 'usehooks-ts'

import { useAppContext } from '@/app/context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { revalidateClickHouse } from '@/lib/clickhouse-action'
import { formatReadableSecondDuration } from '@/lib/format-readable'
import { cn } from '@/lib/utils'

interface ReloadButtonProps {
  className?: string
}

const SECOND = 1000
const MINUTE = 60 * SECOND

export function ReloadButton({ className }: ReloadButtonProps) {
  const router = useRouter()
  const [isLoading, startTransition] = useTransition()
  const { reloadInterval, setReloadInterval } = useAppContext()

  const initCountDown = reloadInterval ? reloadInterval / 1000 : 10
  const [countDown, setCountDown] = useState(initCountDown)

  const refreshRouter = () => {
    startTransition(() => router.refresh())
  }

  const revalidateCacheAndReload = () => {
    revalidateClickHouse()
    refreshRouter()
  }

  useEffect(() => {
    if (reloadInterval) {
      setCountDown(reloadInterval / 1000)
    }
  }, [reloadInterval])

  useInterval(
    () => {
      if (countDown <= 0) {
        revalidateCacheAndReload()
        setCountDown(initCountDown)
        return
      } else {
        setCountDown(countDown - 1)
      }
    },
    !isLoading && reloadInterval != null ? 1000 : null
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'flex flex-row gap-2',
            className,
            isLoading ? 'animate-pulse' : ''
          )}
        >
          <span>{formatReadableSecondDuration(countDown)}</span>
          <ReloadIcon
            className={cn('size-4', isLoading ? 'animate-spin' : '')}
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56">
        <DropdownMenuItem onClick={revalidateCacheAndReload}>
          Reload Now
          <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => setReloadInterval(30 * SECOND)}>
          30s
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setReloadInterval(1 * MINUTE)}>
          1m
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setReloadInterval(2 * MINUTE)}>
          2m
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setReloadInterval(10 * MINUTE)}>
          10m
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setReloadInterval(30 * MINUTE)}>
          30m
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setReloadInterval(null)}>
          Disable Auto
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
