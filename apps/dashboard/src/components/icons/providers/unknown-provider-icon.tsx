/**
 * Fallback provider mark for unknown / unconfigured providers.
 *
 * A simple chip / circuit-board square with a question-mark-like dot.
 */
interface UnknownProviderIconProps {
  className?: string
  size?: number
}

export function UnknownProviderIcon({
  className,
  size = 16,
}: UnknownProviderIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect
        x="2"
        y="2"
        width="12"
        height="12"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    </svg>
  )
}
