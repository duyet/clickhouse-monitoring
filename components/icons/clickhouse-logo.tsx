import { memo } from 'react'

export const ClickHouseLogo = memo(function ClickHouseLogo({
  className,
  width = 24,
  height = 24,
}: {
  className?: string
  width?: number
  height?: number
}) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      className={className}
    >
      <title>ClickHouse</title>
      <path
        fill="currentColor"
        d="M21.333 10H24v4h-2.667ZM16 1.335h2.667v21.33H16Zm-5.333 0h2.666v21.33h-2.666ZM0 22.665V1.335h2.667v21.33zm5.333-21.33H8v21.33H5.333Z"
      />
    </svg>
  )
})
