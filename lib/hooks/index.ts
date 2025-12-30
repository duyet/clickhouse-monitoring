/**
 * React Hooks
 *
 * Re-exports all custom hooks for easy importing
 */

export { useKeyboardShortcut } from './use-keyboard-shortcut'
export { useDebounce, useDebouncedCallback, useDebounceWithPending, DEBOUNCE_DELAY } from './use-debounce'
export {
  useRenderPerformance,
  useAsyncPerformance,
  useMountPerformance,
  getPerformanceMetrics,
  getComponentMetrics,
  clearPerformanceMetrics,
  logPerformanceSummary,
  PERFORMANCE_THRESHOLDS,
  type PerformanceMetrics,
} from './use-performance'
