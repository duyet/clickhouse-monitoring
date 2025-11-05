import { CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons'

interface BooleanFormatProps {
  value: string | number | boolean
}

export function BooleanFormat({ value }: BooleanFormatProps): React.ReactNode {
  const isTrue =
    typeof value === 'string'
      ? ['true', '1', 'yes', 'y', 't'].includes(value.toLowerCase())
      : !!value

  return isTrue ? (
    <CheckCircledIcon aria-label="yes" className="text-green-700" />
  ) : (
    <CrossCircledIcon aria-label="no" className="text-rose-700" />
  )
}
