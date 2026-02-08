/**
 * Accessibility components and utilities
 *
 * This directory contains reusable accessibility components and hooks
 * for making the ClickHouse monitoring dashboard more inclusive.
 *
 * @see https://www.w3.org/WAI/WCAG21/quickref/
 */

export { Announce, AnnounceInline } from './announce'
export {
  ChartDataTable,
  ChartSummary,
  VisuallyHidden,
} from './chart-data-table'
export {
  focusFirst,
  getFocusableElements,
  useFocusScope,
  useFocusTrap,
  useReturnFocus,
} from './focus-manager'
export {
  LiveRegion,
  StatusMessage,
  useAnnouncement,
} from './live-region'
// Components
export { SkipLink } from './skip-link'
// Re-export hooks for convenience
export {
  useAccessibilityId,
  useAnnouncement as useAnnouncementHook,
  useColorScheme,
  useFocusManagement,
  useFocusTrap as useFocusTrapHook,
  useKeyboardNavigation,
  useReducedMotion,
  useScreenReaderOnly,
} from '@/hooks/use-accessibility'
// Re-export from utils for convenience
export {
  generateAccessibilityId,
  getContrastRatio,
  getHeadingLevel,
  getIconButtonProps,
  getLiveRegionProps,
  getPrefersReducedMotion,
  isAccessibleElement,
  joinAriaIds,
  linkDescriptiveElement,
  linkLabelToInput,
  meetsWCAG_AA,
} from '@/lib/utils/accessibility'
