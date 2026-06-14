import type { KeyboardEvent } from 'react'

/**
 * Build an onKeyDown handler that activates a non-button element (a clickable
 * Card, span, etc. given `role="button"` + `tabIndex={0}`) on Enter or Space —
 * mirroring native `<button>` keyboard semantics. `preventDefault` stops Space
 * from scrolling the page.
 *
 * Replaces the copy-pasted
 *   `if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn() }`
 * blocks. Not a hook (uses no React hooks) — safe to call inline in JSX.
 *
 * @example
 * <Card role="button" tabIndex={0} onClick={open} onKeyDown={activateOnEnterOrSpace(open)} />
 */
export function activateOnEnterOrSpace(activate: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      activate()
    }
  }
}
