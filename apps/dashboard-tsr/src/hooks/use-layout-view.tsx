import { useCallback, useMemo } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { usePathname, useRouter, useSearchParams } from '@/lib/next-compat'

export function useLayoutView(): [
  'table' | 'cards',
  (newView: 'table' | 'cards') => void,
] {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const layoutParam = searchParams.get('layout')

  const isMobile = useIsMobile()
  const view = useMemo<'table' | 'cards'>(() => {
    if (layoutParam === 'card') return 'cards'
    if (layoutParam === 'table') return 'table'
    return isMobile ? 'cards' : 'table'
  }, [layoutParam, isMobile])

  const setView = useCallback(
    (newView: 'table' | 'cards') => {
      const params = new URLSearchParams(searchParams.toString())
      if (newView === 'cards') {
        params.set('layout', 'card')
      } else {
        params.set('layout', 'table')
      }
      router.replace(`${pathname}?${params.toString()}`)
    },
    [searchParams, router, pathname]
  )

  return [view, setView]
}
