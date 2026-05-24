'use client'

import type { Slot } from '@radix-ui/react-slot'

import { useEffect, useState } from 'react'
import { FormControl, useFormField } from '@/components/ui/form'
import { cn } from '@/lib/utils'

const SHAKE_DURATION_MS = 320

type ShakeFormControlProps = React.ComponentProps<typeof Slot>

export function ShakeFormControl({
  className,
  ...props
}: ShakeFormControlProps) {
  const { error } = useFormField()
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (!error) return
    setShake(true)
    const timer = setTimeout(() => setShake(false), SHAKE_DURATION_MS)
    return () => clearTimeout(timer)
  }, [error])

  return (
    <FormControl
      {...props}
      className={cn(className, shake && 't-error-shake')}
    />
  )
}
