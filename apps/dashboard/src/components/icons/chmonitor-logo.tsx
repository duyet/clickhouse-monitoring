/**
 * chmonitor brand mark.
 *
 * Flat mark: five orange metric bars of varying height on ClickHouse's column
 * grid, with an emerald square top-cap on the left bar (the "live / healthy"
 * signal). Geometry mirrors the brand asset kit
 * (`apps/landing/scripts/build-brand-assets.ts`) so the in-app mark stays in
 * sync with the favicons and landing lockup.
 */
const BARS = [
  { x: 3.3, y: 13.05, h: 15.45 },
  { x: 8.7, y: 3.5, h: 25 },
  { x: 14.1, y: 13.25, h: 15.25 },
  { x: 19.5, y: 6.25, h: 22.25 },
  { x: 24.9, y: 16.8, h: 11.7 },
]
const W = 3.8
const CAP = { x: 3.3, y: 9.75, h: 3.3 }

interface ChmonitorLogoProps {
  className?: string
  width?: number
  height?: number
}

export const ChmonitorLogo = function ChmonitorLogo({
  className,
  width = 24,
  height = 24,
}: ChmonitorLogoProps) {
  return (
    <svg
      role="img"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      className={className}
    >
      <title>chmonitor</title>
      {BARS.map((b) => (
        <rect
          key={b.x}
          x={b.x}
          y={b.y}
          width={W}
          height={b.h}
          className="fill-orange-500"
        />
      ))}
      <rect
        x={CAP.x}
        y={CAP.y}
        width={W}
        height={CAP.h}
        className="fill-emerald-500"
      />
    </svg>
  )
}
