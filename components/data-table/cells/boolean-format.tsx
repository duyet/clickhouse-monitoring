import { CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons'

interface BooleanFormatProps {
  value: any
}

export function BooleanFormat({ value }: BooleanFormatProps) {
  const isTrue =
    typeof value === 'string'
      ? ['true', '1', 'yes', 'y', 't'].includes(value.toLowerCase())
      : !!value

  const isFalse =
    typeof value === 'string'
      ? ['false', '0', 'no', 'n', 'f'].includes(value.toLowerCase())
      : !value

  return isTrue ? (
    <CheckCircledIcon aria-label="yes" className="text-green-700" />
  ) : isFalse ? (
    <CrossCircledIcon aria-label="no" className="text-rose-700" />
  ) : null
}
