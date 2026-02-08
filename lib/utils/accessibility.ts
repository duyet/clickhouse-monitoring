/**
 * Accessibility utility functions
 *
 * Common helpers for implementing accessibility features across the application.
 */

/**
 * Generate a unique ID for accessibility associations
 * Useful for connecting labels to inputs, descriptions to elements, etc.
 *
 * @example
 * ```tsx
 * const inputId = useAccessibilityId('input')
 * const descriptionId = useAccessibilityId('description')
 *
 * return (
 *   <>
 *     <label htmlFor={inputId}>Email</label>
 *     <input id={inputId} aria-describedby={descriptionId} />
 *     <p id={descriptionId}>We'll never share your email</p>
 *   </>
 * )
 * ```
 */
export function generateAccessibilityId(
  prefix: string,
  suffix: string = Math.random().toString(36).substring(2, 9)
): string {
  return `a11y-${prefix}-${suffix}`
}

/**
 * Create a concatenated ARIA description from multiple IDs
 * Useful when an element needs to reference multiple descriptive elements.
 *
 * @example
 * ```tsx
 * const hintId = useAccessibilityId('hint')
 * const errorId = useAccessibilityId('error')
 *
 * <input
 *   aria-describedby={joinAriaIds(hintId, errorId)}
 * />
 * ```
 */
export function joinAriaIds(...ids: (string | undefined | null)[]): string {
  return ids.filter(Boolean).join(' ')
}

/**
 * Determine if an element should be announced to screen readers
 * Based on visibility, disabled state, and other factors.
 *
 * @example
 * ```tsx
 * const shouldAnnounce = isAccessibleElement({ visible: true, disabled: false })
 * ```
 */
export function isAccessibleElement(options: {
  visible?: boolean
  disabled?: boolean
  hidden?: boolean
  ariaHidden?: boolean | 'true' | 'false'
}): boolean {
  if (options.visible === false) return false
  if (options.disabled === true) return false
  if (options.hidden === true) return false
  if (options.ariaHidden === true || options.ariaHidden === 'true') return false
  return true
}

/**
 * Generate proper ARIA props for icon-only buttons
 * Ensures consistent accessibility across the application.
 *
 * @example
 * ```tsx
 * const iconButtonProps = getIconButtonProps('Refresh data', 'R')
 *
 * <button {...iconButtonProps}>
 *   <RefreshIcon />
 * </button>
 * ```
 */
export function getIconButtonProps(
  label: string,
  shortcut?: string
): {
  'aria-label': string
  title: string
} {
  const props: { 'aria-label': string; title: string } = {
    'aria-label': label,
    title: label,
  }

  if (shortcut) {
    props['aria-label'] = `${label} (${shortcut})`
    props.title = `${label} (${shortcut})`
  }

  return props
}

/**
 * Check if code is running in a reduced motion preference context
 * Useful for conditionally disabling animations.
 *
 * @example
 * ```tsx
 * const prefersReducedMotion = useReducedMotion()
 *
 * <div className={prefersReducedMotion ? 'no-animation' : 'with-animation'}>
 *   Content
 * </div>
 * ```
 */
export function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get the appropriate heading level for nested content
 * Ensures proper heading hierarchy is maintained.
 *
 * @example
 * ```tsx
 * function AccordionItem({ level, title, content }) {
 *   const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements
 *
 *   return (
 *     <section>
 *       <HeadingTag>{title}</HeadingTag>
 *       <div>{content}</div>
 *     </section>
 *   )
 * }
 * ```
 */
export function getHeadingLevel(
  currentLevel: number,
  increment: number = 1
): 1 | 2 | 3 | 4 | 5 | 6 {
  const nextLevel = Math.min(Math.max(currentLevel + increment, 1), 6)
  return nextLevel as 1 | 2 | 3 | 4 | 5 | 6
}

/**
 * Create a relationship between a descriptive element and its target
 * Returns the props needed for both elements.
 *
 * @example
 * ```tsx
 * const id = useAccessibilityId('description')
 * const { descriptionProps, targetProps } = linkDescriptiveElement(id)
 *
 * <>
 *   <button {...targetProps}>Action</button>
 *   <span {...descriptionProps}>This explains the action</span>
 * </>
 * ```
 */
export function linkDescriptiveElement(id: string): {
  descriptionProps: { id: string }
  targetProps: { 'aria-describedby': string }
} {
  return {
    descriptionProps: { id },
    targetProps: { 'aria-describedby': id },
  }
}

/**
 * Create a label-input association
 * Returns the props needed for both elements.
 *
 * @example
 * ```tsx
 * const id = useAccessibilityId('email')
 * const { labelProps, inputProps } = linkLabelToInput(id, 'Email')
 *
 * <>
 *   <label {...labelProps}>Email address</label>
 *   <input type="email" {...inputProps} required />
 * </>
 * ```
 */
export function linkLabelToInput(
  id: string,
  label: string
): {
  labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
  inputProps: { id: string; 'aria-label'?: string }
} {
  return {
    labelProps: { htmlFor: id, children: label },
    inputProps: { id: id },
  }
}

/**
 * Calculate color contrast ratio between two colors
 * Returns WCAG contrast ratio (1-21).
 *
 * @example
 * ```tsx
 * const ratio = getContrastRatio('#ffffff', '#000000')
 * console.log(ratio) // 21 (maximum contrast)
 *
 * if (ratio >= 4.5) {
 *   console.log('Meets WCAG AA for normal text')
 * }
 * if (ratio >= 3.1) {
 *   console.log('Meets WCAG AA for large text')
 * }
 * ```
 */
export function getContrastRatio(
  foreground: string,
  background: string
): number {
  const fg = hexToRgb(foreground)
  const bg = hexToRgb(background)

  if (!fg || !bg) return 1

  const fgLuminance = getRelativeLuminance(fg)
  const bgLuminance = getRelativeLuminance(bg)

  const lighter = Math.max(fgLuminance, bgLuminance)
  const darker = Math.min(fgLuminance, bgLuminance)

  return (lighter + 0.05) / (darker + 0.05)
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

function getRelativeLuminance(rgb: {
  r: number
  g: number
  b: number
}): number {
  const { r, g, b } = rgb

  const sRGB = [r, g, b].map((channel) => {
    const sRGB = channel / 255
    return sRGB <= 0.03928 ? sRGB / 12.92 : ((sRGB + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2]
}

/**
 * Check if contrast meets WCAG AA standard
 *
 * @example
 * ```tsx
 * if (meetsWCAG_AA('#ffffff', '#000000', 'normal')) {
 *   console.log('Passes WCAG AA for normal text')
 * }
 * ```
 */
export function meetsWCAG_AA(
  foreground: string,
  background: string,
  type: 'normal' | 'large' = 'normal'
): boolean {
  const ratio = getContrastRatio(foreground, background)
  return type === 'normal' ? ratio >= 4.5 : ratio >= 3
}

/**
 * Generate ARIA live region props based on importance
 *
 * @example
 * ```tsx
 * const liveRegionProps = getLiveRegionProps('polite')
 *
 * <div {...liveRegionProps}>{statusMessage}</div>
 * ```
 */
export function getLiveRegionProps(politeness: 'polite' | 'assertive'): {
  'aria-live': string
  'aria-atomic': 'true'
  role: 'status' | 'alert'
} {
  return {
    'aria-live': politeness,
    'aria-atomic': 'true',
    role: politeness === 'assertive' ? 'alert' : 'status',
  }
}
