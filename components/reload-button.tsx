'use client'

import { useState, useTransition } from 'react'
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
  const { reloadInterval } = useAppContext()

  const initCountDown = reloadInterval ? reloadInterval / 1000 : 5
  const [countDown, setCountDown] = useState(initCountDown)

  const refreshRouter = () => {
    startTransition(() => router.refresh())
  }

  const onClickReload = refreshRouter

  useInterval(() => {
    if (countDown <= 0) {
      refreshRouter()
      setCountDown(initCountDown)
      return
    } else {
      setCountDown(countDown - 1)
    }
  }, 1000)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex flex-row gap-2">
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
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Interval</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>5s</DropdownMenuItem>
                <DropdownMenuItem>10s</DropdownMenuItem>
                <DropdownMenuItem>30s</DropdownMenuItem>
                <DropdownMenuItem>10m</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Disable Auto</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
