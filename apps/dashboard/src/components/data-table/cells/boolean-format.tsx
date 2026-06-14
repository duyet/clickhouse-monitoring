import { CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons'

interface BooleanFormatProps {
  value: string | number | boolean
  /**
   * Invert the color semantics: render `true` as red (alarming) and `false`
   * as green. Use when a truthy value represents a problem state — e.g.
   * `is_readonly` on the Readonly Tables page, where a readonly replica is bad.
   * Icons are unchanged (check for true, cross for false); only colors flip.
   */
  invert?: boolean
}

export const BooleanFormat = function BooleanFormat({
  value,
  invert = false,
}: BooleanFormatProps): React.ReactNode {
  const isTrue =
    typeof value === 'string'
      ? ['true', '1', 'yes', 'y', 't'].includes(value.toLowerCase())
      : !!value

  return isTrue ? (
    <CheckCircledIcon
      aria-label="yes"
      className={invert ? 'text-rose-700' : 'text-green-700'}
    />
  ) : (
    <CrossCircledIcon
      aria-label="no"
      className={invert ? 'text-green-700' : 'text-rose-700'}
    />
  )
}
