// Barrel for the data-fetching helpers. NOTE: the directory name `swr` is
// legacy — the app uses TanStack Query (see ../query). These are generic fetch
// helpers + the router-based host hook, not SWR-specific.
export { apiFetch } from './api-fetch'
export {
  REFRESH_INTERVAL,
  type RefreshInterval,
  visibilityAwareInterval,
} from './config'
export { type FetchError, throwIfNotOk } from './fetch-error'
export { useHostId } from './use-host'
