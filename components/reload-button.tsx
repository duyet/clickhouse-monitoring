'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ReloadIcon } from '@radix-ui/react-icons'
import { useInterval } from 'usehooks-ts'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppContext } from '@/app/context'

interface ReloadButtonProps {
  className?: string
}

export function ReloadButton({ className }: ReloadButtonProps) {
  const router = useRouter()
  const [isLoading, startTransition] = useTransition()
  const { reloadInterval, setReloadInterval } = useAppContext()

  const initCountDown = reloadInterval ? reloadInterval / 1000 : 10
  const [countDown, setCountDown] = useState(initCountDown)

  const refreshRouter = () => {
    startTransition(() => router.refresh())
  }

  const onClickReload = refreshRouter

  useEffect(() => {
    if (reloadInterval) {
      setCountDown(reloadInterval / 1000)
    }
  }, [reloadInterval])

  useInterval(
    () => {
      if (countDown <= 0) {
        refreshRouter()
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
          <span>{countDown}s</span>
          <ReloadIcon
            className={cn('h-4 w-4', isLoading ? 'animate-spin' : '')}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem onClick={onClickReload}>
          Reload Now
          <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => setReloadInterval(10 * 1000)}>
          10s
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setReloadInterval(30 * 1000)}>
          30s
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setReloadInterval(10 * 60 * 1000)}>
          10m
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setReloadInterval(null)}>
          Disable Auto
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
