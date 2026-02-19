/**
 * React Hooks
 *
 * Re-exports all custom hooks for easy importing
 */

export { useCustomHosts } from './use-custom-hosts'
export {
  DEBOUNCE_DELAY,
  useDebounce,
  useDebouncedCallback,
  useDebounceWithPending,
} from './use-debounce'
export { useKeyboardShortcut } from './use-keyboard-shortcut'
export {
  clearPerformanceMetrics,
  getComponentMetrics,
  getPerformanceMetrics,
  logPerformanceSummary,
  PERFORMANCE_THRESHOLDS,
  type PerformanceMetrics,
  useAsyncPerformance,
  useMountPerformance,
  useRenderPerformance,
} from './use-performance'
