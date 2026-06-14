// Build header category nav from generated sidebar groups.

export interface NavItem {
  label: string
  link: string
}

export interface NavGroup {
  label: string
  link?: string
  items?: NavItem[]
}

export interface HeaderCategory {
  label: string
  href: string
  items: NavItem[]
}

/** Groups omitted from the top menu (still in the left sidebar). */
export const HEADER_NAV_SKIP = new Set(['More'])

export function groupHref(group: NavGroup): string {
  if (group.link) return group.link
  const overview = group.items?.find((it) => it.label === 'Overview')
  return overview?.link ?? group.items?.[0]?.link ?? '/'
}

export function isGroupActive(group: NavGroup, currentPath: string): boolean {
  if (group.link && group.link === currentPath) return true
  return group.items?.some((it) => it.link === currentPath) ?? false
}

export function toHeaderCategories(groups: NavGroup[]): HeaderCategory[] {
  return groups
    .filter((g) => !HEADER_NAV_SKIP.has(g.label))
    .map((g) => ({
      label: g.label,
      href: groupHref(g),
      items: g.items ?? (g.link ? [{ label: g.label, link: g.link }] : []),
    }))
}