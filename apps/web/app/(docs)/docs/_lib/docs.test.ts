import { docsContent } from './content.generated'
import { docsNav } from './docs'
import { describe, expect, test } from 'bun:test'

describe('docsNav coverage', () => {
  test('every docsContent page is reachable from the sidebar', () => {
    const navSlugs = new Set(
      docsNav.flatMap((section) => section.items).map((item) => item.slug)
    )

    const orphans = Object.keys(docsContent).filter(
      (slug) => !navSlugs.has(slug)
    )

    expect(orphans).toEqual([])
  })
})
