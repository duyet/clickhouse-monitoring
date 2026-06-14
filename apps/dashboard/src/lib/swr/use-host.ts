import { useSearch } from '@tanstack/react-router'

/**
 * Read the active host id from the typed `?host=` search param (declared +
 * defaulted to 0 on the root route's validateSearch). Replaces the Next app's
 * `useSearchParams().get('host')`.
 *
 * `strict: false` so deeply-nested, route-agnostic consumers (charts, badges —
 * the "hooks at deepest consumer" convention) can read it without knowing their
 * route. The root validator always supplies a number, so `?? 0` is belt-and-
 * suspenders.
 */
export function useHostId(): number {
  const search = useSearch({ strict: false }) as { host?: number }
  return search.host ?? 0
}
