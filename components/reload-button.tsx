'use client'

import { ReloadIcon } from '@radix-ui/react-icons'
import { useRouter } from 'next/navigation'
import { memo, useCallback, useEffect, useState, useTransition } from 'react'
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
import { formatReadableSecondDuration } from '@/lib/format-readable'
import { cn } from '@/lib/utils'

interface ReloadButtonProps {
  className?: string
}

const SECOND = 1000
const MINUTE = 60 * SECOND

export const ReloadButton = memo(function ReloadButton({ className }: ReloadButtonProps) {
  const router = useRouter()
  const [isLoading, startTransition] = useTransition()
  const { reloadInterval, setReloadInterval } = useAppContext()

  const initCountDown = reloadInterval ? reloadInterval / 1000 : 10
  const [countDown, setCountDown] = useState(initCountDown)

  const revalidateCacheAndReload = useCallback(() =>
    startTransition(async () => {
      router.refresh()
    }), [startTransition, router])

  const handleSetReloadInterval = useCallback((interval: number | null) => {
    setReloadInterval(interval)
  }, [setReloadInterval])

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
          <span className="font-mono">
            {formatReadableSecondDuration(countDown)}
          </span>
          <ReloadIcon
            className={cn('size-4', isLoading ? 'animate-spin' : '')}
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56">
        <DropdownMenuItem onClick={revalidateCacheAndReload}>
          Reload (Clear Cache)
          <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => handleSetReloadInterval(30 * SECOND)}>
          30s
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSetReloadInterval(1 * MINUTE)}>
          1m
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSetReloadInterval(2 * MINUTE)}>
          2m
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSetReloadInterval(10 * MINUTE)}>
          10m
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSetReloadInterval(30 * MINUTE)}>
          30m
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleSetReloadInterval(null)}>
          Disable Auto
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
