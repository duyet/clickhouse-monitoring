'use client'

import { useEffect, useState } from 'react'
import { FormControl, useFormField } from '@/components/ui/form'
import { cn } from '@/lib/utils'

// Must stay in sync with the CSS `t-error-shake` animation duration in
// app/globals.css: calc(var(--shake-dur-a) * 2 + var(--shake-dur-b) * 2)
// which currently resolves to 280ms.
const SHAKE_DURATION_MS = 280

type ShakeFormControlProps = React.ComponentProps<typeof FormControl>

export function ShakeFormControl({
  className,
  ...props
}: ShakeFormControlProps) {
  const { error } = useFormField()
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (!error) {
      setShake(false)
      return
    }
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
