'use client'

import { type SVGProps, useMemo } from 'react'

export interface SparklinePoint {
  value: number
  timestamp?: string
}

export interface SparklineProps extends Omit<SVGProps<SVGSVGElement>, 'data'> {
  /** Array of data points to display */
  data: readonly SparklinePoint[] | number[]
  /** Width of the sparkline in pixels */
  width?: number
  /** Height of the sparkline in pixels */
  height?: number
  /** Stroke color */
  color?: string
  /** Fill color for area chart (if not provided, no fill) */
  fillColor?: string
  /** Stroke width in pixels */
  strokeWidth?: number
  /** Show dots at min/max points */
  showExtremes?: boolean
  /** Type of sparkline: 'line' or 'area' */
  type?: 'line' | 'area'
  /** Color code: green for upward trend, red for downward */
  trendColor?: boolean
  /** Smooth curve using bezier interpolation */
  smooth?: boolean
}

/**
 * Helper to extract value from a data point
 */
function getPointValue(point: SparklinePoint | number): number {
  return typeof point === 'number' ? point : point.value
}

/**
 * Normalize data points to 0-1 range for SVG rendering
 */
function normalizePoints(
  data: readonly SparklinePoint[] | number[]
): { x: number; y: number; original: SparklinePoint | number }[] {
  const values = data.map((d) => getPointValue(d))

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1 // Avoid division by zero

  return values.map((value, index) => ({
    x: index / (values.length - 1 || 1),
    y: (value - min) / range,
    original: data[index],
  }))
}

/**
 * Generate SVG path commands for the sparkline
 */
function generatePath(
  points: readonly { x: number; y: number }[],
  smooth: boolean,
  close: boolean
): string {
  if (points.length === 0) return ''

  if (points.length === 1) {
    return `M 0 ${points[0].y} L 1 ${points[0].y}`
  }

  if (!smooth) {
    // Simple line
    let path = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`
    }
    return path
  }

  // Smooth bezier curve
  const first = points[0]
  let path = `M ${first.x} ${first.y}`

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i]
    const next = points[i + 1]

    // Control points for bezier curve (simple smoothing)
    const controlX = (current.x + next.x) / 2
    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`
  }

  if (close) {
    // Close the path for area fill
    path += ` L ${points[points.length - 1].x} 1 L 0 1 Z`
  }

  return path
}

/**
 * Sparkline component - displays a mini line/area chart
 *
 * @example
 * ```tsx
 * <Sparkline data={[1, 3, 2, 5, 4]} width={100} height={30} />
 * <Sparkline
 *   data={[{value: 10, timestamp: '2024-01-01'}, ...]}
 *   type="area"
 *   showExtremes
 * />
 * ```
 */
export function Sparkline({
  data,
  width = 100,
  height = 30,
  color = 'currentColor',
  fillColor,
  strokeWidth = 1.5,
  showExtremes = false,
  type = 'line',
  trendColor = false,
  smooth = true,
  ...svgProps
}: SparklineProps) {
  // Generate unique ID for this instance's gradient
  const gradientId = useMemo(
    () => `sparkline-gradient-${type}-${Math.random().toString(36).slice(2)}`,
    [type]
  )

  const { points, path, areaPath, extremes, trend } = useMemo(() => {
    const normalizedPoints = normalizePoints(data)

    if (normalizedPoints.length === 0) {
      return {
        points: normalizedPoints,
        path: '',
        areaPath: '',
        extremes: null,
        trend: 'neutral' as const,
      }
    }

    const linePath = generatePath(normalizedPoints, smooth, false)
    const areaPathStr =
      type === 'area' ? generatePath(normalizedPoints, smooth, true) : ''

    // Find min/max points
    let minPoint = normalizedPoints[0]
    let maxPoint = normalizedPoints[0]

    for (const point of normalizedPoints) {
      const value = getPointValue(point.original)
      const minValue = getPointValue(minPoint.original)
      const maxValue = getPointValue(maxPoint.original)

      if (value < minValue) minPoint = point
      if (value > maxValue) maxPoint = point
    }

    // Determine trend direction
    const firstValue = getPointValue(normalizedPoints[0].original)
    const lastValue = getPointValue(
      normalizedPoints[normalizedPoints.length - 1].original
    )
    const trendDirection =
      lastValue > firstValue
        ? 'up'
        : lastValue < firstValue
          ? 'down'
          : 'neutral'

    return {
      points: normalizedPoints,
      path: linePath,
      areaPath: areaPathStr,
      extremes: showExtremes ? { min: minPoint, max: maxPoint } : null,
      trend: trendDirection,
    }
  }, [data, smooth, type, showExtremes])

  // Determine color based on trend
  const strokeColor = trendColor
    ? trend === 'up'
      ? 'rgb(34 197 94)' // green-500
      : trend === 'down'
        ? 'rgb(239 68 68)' // red-500
        : color
    : color

  if (points.length === 0) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="inline-block align-middle"
        {...svgProps}
      >
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={10}
          fill="hsl(var(--muted-foreground))"
        >
          No data
        </text>
      </svg>
    )
  }

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="inline-block align-middle overflow-visible"
      {...svgProps}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop
            offset="0%"
            stopColor={fillColor || strokeColor}
            stopOpacity={0.3}
          />
          <stop
            offset="100%"
            stopColor={fillColor || strokeColor}
            stopOpacity={0.05}
          />
        </linearGradient>
      </defs>

      {/* Area fill */}
      {type === 'area' && areaPath && (
        <path
          d={areaPath}
          fill={`url(#${gradientId})`}
          stroke="none"
          transform={`scale(${width}, ${height})`}
        />
      )}

      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth / Math.max(width, height)}
        strokeLinecap="round"
        strokeLinejoin="round"
        transform={`scale(${width}, ${height})`}
      />

      {/* Min/Max dots */}
      {extremes && (
        <g transform={`scale(${width}, ${height})`}>
          <circle
            cx={extremes.min.x}
            cy={extremes.min.y}
            r={0.03}
            fill="rgb(239 68 68)" // red-500
            stroke="white"
            strokeWidth={0.01}
          />
          <circle
            cx={extremes.max.x}
            cy={extremes.max.y}
            r={0.03}
            fill="rgb(34 197 94)" // green-500
            stroke="white"
            strokeWidth={0.01}
          />
        </g>
      )}
    </svg>
  )
}
