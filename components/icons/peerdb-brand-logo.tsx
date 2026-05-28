import type { LucideProps } from 'lucide-react'

import { forwardRef } from 'react'

/** Official PeerDB winged elephant logo icon, centered in a standard 24x24 box. */
export const PeerDBLogo = forwardRef<SVGSVGElement, LucideProps>(
  ({ className, width = 24, height = 24, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        role="img"
        viewBox="0 0 24 24"
        fill="currentColor"
        width={width}
        height={height}
        className={className}
        {...props}
      >
        <title>PeerDB</title>
        <g transform="translate(0, 5.016) scale(0.291)">
          {/* Elephant outline and body */}
          <path d="M35.6667 5.33333H7.696C4.26982 5.33333 1.20301 3.20804 0 0H64.7681C77.5091 0 86.5059 12.4823 82.4768 24.5696L74.6667 48H69.3333L77.7611 22.9126C80.6634 14.2732 74.2358 5.33333 65.1219 5.33333H41V8C41 18.3093 49.3574 26.6667 59.6667 26.6667H71L64 48H58.6667L64 32H59.6667C46.4118 32 35.6667 21.2548 35.6667 8V5.33333Z" />
          {/* Wing feather 1 */}
          <path d="M17.6667 26.6667H14.696C11.2698 26.6667 8.20301 24.5414 7 21.3333H19.6667L21.3333 16H10.921C7.59675 16 4.65821 13.8396 3.66667 10.6667H28.3333L16 48H10.6667L17.6667 26.6667Z" />
          {/* Wing feather 2 */}
          <path d="M32 48H26.6667L29.6936 38.9193C31.0709 34.7872 34.9379 32 39.2936 32C46.2006 32 51.0778 38.7667 48.8936 45.3193L48 48H42.3333L43.7258 43.9493C44.84 40.7079 42.4316 37.3333 39.0041 37.3333C36.8202 37.3333 34.8898 38.7526 34.2384 40.837L32 48Z" />
          {/* Elephant eye dot */}
          <path d="M70.6667 16C70.6667 18.2091 68.8758 20 66.6667 20C64.4575 20 62.6667 18.2091 62.6667 16C62.6667 13.7909 64.4575 12 66.6667 12C68.8758 12 70.6667 13.7909 70.6667 16Z" />
        </g>
      </svg>
    )
  }
)

PeerDBLogo.displayName = 'PeerDBLogo'
