import { describe, expect, test } from 'bun:test'
import { OG_DOMAIN, OG_PAGES, ogImageUrl, pageOgHead, type OgPage } from './og'

// ── OG_DOMAIN ────────────────────────────────────────────────────────────────

describe('OG_DOMAIN', () => {
  test('is the canonical dash URL (no trailing slash)', () => {
    expect(OG_DOMAIN).toBe('https://dash.chmonitor.dev')
    expect(OG_DOMAIN.endsWith('/')).toBe(false)
  })
})

// ── OG_PAGES ─────────────────────────────────────────────────────────────────

describe('OG_PAGES', () => {
  test('is a non-empty record', () => {
    const keys = Object.keys(OG_PAGES)
    expect(keys.length).toBeGreaterThan(0)
  })

  test('every entry has required string fields', () => {
    for (const [slug, page] of Object.entries(OG_PAGES)) {
      expect(typeof page.eyebrow, `${slug}.eyebrow`).toBe('string')
      expect(page.eyebrow.length, `${slug}.eyebrow non-empty`).toBeGreaterThan(
        0
      )
      expect(typeof page.title, `${slug}.title`).toBe('string')
      expect(page.title.length, `${slug}.title non-empty`).toBeGreaterThan(0)
      expect(typeof page.description, `${slug}.description`).toBe('string')
      expect(
        page.description.length,
        `${slug}.description non-empty`
      ).toBeGreaterThan(0)
    }
  })

  test('headTitle, when present, is a non-empty string', () => {
    for (const [slug, page] of Object.entries(OG_PAGES)) {
      if (page.headTitle !== undefined) {
        expect(typeof page.headTitle, `${slug}.headTitle type`).toBe('string')
        expect(
          page.headTitle.length,
          `${slug}.headTitle non-empty`
        ).toBeGreaterThan(0)
      }
    }
  })

  test('agents entry has a different headTitle from title', () => {
    const agents = OG_PAGES['agents']
    expect(agents).toBeDefined()
    expect(agents.headTitle).toBe('AI Agent')
    expect(agents.title).toBe('Ask your cluster anything')
    expect(agents.headTitle).not.toBe(agents.title)
  })

  test('overview entry has no headTitle (uses title)', () => {
    expect(OG_PAGES['overview'].headTitle).toBeUndefined()
  })

  test('contains expected slugs', () => {
    const expected = [
      'overview',
      'clusters',
      'explorer',
      'agents',
      'running-queries',
      'history-queries',
      'failed-queries',
      'slow-queries',
      'expensive-queries',
      'merges',
      'mutations',
      'tables',
      'replicas',
      'settings',
      'users',
      'query-cache',
      'backups',
      'disks',
    ]
    for (const slug of expected) {
      expect(OG_PAGES[slug], `slug "${slug}" exists`).toBeDefined()
    }
  })

  test('OgPage type is satisfied at runtime (structural check)', () => {
    const page: OgPage = OG_PAGES['overview']
    expect(page.eyebrow).toBe('OVERVIEW')
    expect(page.title).toBe('Cluster Overview')
  })
})

// ── ogImageUrl ────────────────────────────────────────────────────────────────

describe('ogImageUrl', () => {
  test('returns absolute URL rooted at OG_DOMAIN', () => {
    const url = ogImageUrl('overview')
    expect(url.startsWith(OG_DOMAIN)).toBe(true)
  })

  test('pattern: <domain>/og/og-<slug>.png', () => {
    expect(ogImageUrl('overview')).toBe(
      'https://dash.chmonitor.dev/og/og-overview.png'
    )
  })

  test('hyphenated slug is embedded verbatim', () => {
    expect(ogImageUrl('running-queries')).toBe(
      'https://dash.chmonitor.dev/og/og-running-queries.png'
    )
    expect(ogImageUrl('query-cache')).toBe(
      'https://dash.chmonitor.dev/og/og-query-cache.png'
    )
    expect(ogImageUrl('history-queries')).toBe(
      'https://dash.chmonitor.dev/og/og-history-queries.png'
    )
  })

  test('arbitrary slug (not in OG_PAGES) is accepted — no validation', () => {
    expect(ogImageUrl('custom-page')).toBe(
      'https://dash.chmonitor.dev/og/og-custom-page.png'
    )
  })

  test('empty slug produces og-.png (degenerate but well-defined)', () => {
    expect(ogImageUrl('')).toBe('https://dash.chmonitor.dev/og/og-.png')
  })

  test('all known OG_PAGES slugs produce valid-looking URLs', () => {
    for (const slug of Object.keys(OG_PAGES)) {
      const url = ogImageUrl(slug)
      expect(url).toMatch(/^https:\/\/dash\.chmonitor\.dev\/og\/og-.+\.png$/)
    }
  })
})

// ── pageOgHead ────────────────────────────────────────────────────────────────

describe('pageOgHead', () => {
  test('returns an object with a meta array', () => {
    const head = pageOgHead('overview')
    expect(Array.isArray(head.meta)).toBe(true)
    expect(head.meta.length).toBeGreaterThan(0)
  })

  test('meta contains a title entry', () => {
    const { meta } = pageOgHead('overview')
    const titleEntry = meta.find((m) => 'title' in m)
    expect(titleEntry).toBeDefined()
    expect((titleEntry as { title: string }).title).toContain('chmonitor')
  })

  test('uses page.title when headTitle is absent', () => {
    // overview has no headTitle → uses title
    const { meta } = pageOgHead('overview')
    const titleEntry = meta.find((m) => 'title' in m) as { title: string }
    expect(titleEntry.title).toBe('Cluster Overview — chmonitor')
  })

  test('uses page.headTitle when present instead of title', () => {
    // agents has headTitle = 'AI Agent', title = 'Ask your cluster anything'
    const { meta } = pageOgHead('agents')
    const titleEntry = meta.find((m) => 'title' in m) as { title: string }
    expect(titleEntry.title).toBe('AI Agent — chmonitor')
    expect(titleEntry.title).not.toContain('Ask your cluster anything')
  })

  test('og:title matches the title entry', () => {
    const { meta } = pageOgHead('tables')
    const titleEntry = meta.find((m) => 'title' in m) as { title: string }
    const ogTitle = meta.find(
      (m) => (m as { property?: string }).property === 'og:title'
    ) as { property: string; content: string }
    expect(ogTitle).toBeDefined()
    expect(ogTitle.content).toBe(titleEntry.title)
  })

  test('og:image is the ogImageUrl for the slug', () => {
    const slug = 'running-queries'
    const { meta } = pageOgHead(slug)
    const ogImage = meta.find(
      (m) => (m as { property?: string }).property === 'og:image'
    ) as { property: string; content: string }
    expect(ogImage).toBeDefined()
    expect(ogImage.content).toBe(ogImageUrl(slug))
  })

  test('twitter:image matches og:image', () => {
    const slug = 'clusters'
    const { meta } = pageOgHead(slug)
    const ogImage = (
      meta.find(
        (m) => (m as { property?: string }).property === 'og:image'
      ) as { content: string }
    ).content
    const twitterImage = (
      meta.find((m) => (m as { name?: string }).name === 'twitter:image') as {
        content: string
      }
    ).content
    expect(twitterImage).toBe(ogImage)
  })

  test('meta has exactly 4 entries', () => {
    // title, og:title, og:image, twitter:image
    expect(pageOgHead('merges').meta).toHaveLength(4)
  })

  test('title separator is " — chmonitor" (em dash)', () => {
    const { meta } = pageOgHead('disks')
    const titleEntry = meta.find((m) => 'title' in m) as { title: string }
    expect(titleEntry.title).toMatch(/ — chmonitor$/)
  })

  test('all OG_PAGES slugs produce head without throwing', () => {
    for (const slug of Object.keys(OG_PAGES) as Array<keyof typeof OG_PAGES>) {
      expect(() => pageOgHead(slug)).not.toThrow()
      const head = pageOgHead(slug)
      expect(head.meta.length).toBe(4)
    }
  })

  test('image URLs for each slug are unique', () => {
    const images = Object.keys(OG_PAGES).map((slug) => {
      const { meta } = pageOgHead(slug as keyof typeof OG_PAGES)
      return (
        meta.find(
          (m) => (m as { property?: string }).property === 'og:image'
        ) as {
          content: string
        }
      ).content
    })
    const unique = new Set(images)
    expect(unique.size).toBe(images.length)
  })
})
