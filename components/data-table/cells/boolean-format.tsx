import { CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons'

interface BooleanFormatProps {
  value: unknown
}

export function BooleanFormat({ value }: BooleanFormatProps) {
  // Handle null/undefined - default to false
  if (value === null || value === undefined) {
    return (
      <span className="text-muted-foreground" aria-label="unspecified">
        -
      </span>
    )
  }

  // Determine boolean value
  const isTrue =
    typeof value === 'string'
      ? ['true', '1', 'yes', 'y', 't'].includes(value.toLowerCase())
      : !!value

  return isTrue ? (
    <CheckCircledIcon aria-label="Yes" className="size-4 text-green-700" />
  ) : (
    <CrossCircledIcon aria-label="No" className="size-4 text-rose-700" />
  )
}
