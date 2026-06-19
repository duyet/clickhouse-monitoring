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

export interface HeaderCategorySection {
  label: string
  items: NavItem[]
}

export interface HeaderCategory {
  label: string
  href: string
  items: NavItem[]
  sections: HeaderCategorySection[]
}

/** Top menu: fewer categories, each maps to one or more sidebar groups. */
export const HEADER_CATEGORIES: { label: string; groups: string[] }[] = [
  { label: 'Introduction', groups: ['Introduction', 'More'] },
  { label: 'Getting Started', groups: ['Getting Started'] },
  { label: 'Deploy', groups: ['Deployment', 'Authentication'] },
  { label: 'Features', groups: ['Features', 'Authentication'] },
  { label: 'AI Agent', groups: ['AI Agent'] },
  {
    label: 'Reference',
    groups: ['Reference', 'Advanced', 'Migrating', 'Releases'],
  },
]

export function slugToPath(slug: string): string {
  return slug ? `/${slug}` : '/'
}

export function isGroupActive(group: NavGroup, currentPath: string): boolean {
  if (group.link && group.link === currentPath) return true
  return group.items?.some((it) => it.link === currentPath) ?? false
}

export function findActiveGroup(
  groups: NavGroup[],
  currentPath: string
): NavGroup | null {
  for (const group of groups) {
    if (isGroupActive(group, currentPath)) return group
  }
  return groups[0] ?? null
}

export function getSidebarItems(group: NavGroup | null): NavItem[] {
  if (!group) return []
  if (group.items?.length) return group.items
  if (group.link) return [{ label: group.label, link: group.link }]
  return []
}

function sectionForGroup(group: NavGroup): HeaderCategorySection {
  if (group.items?.length) {
    return { label: group.label, items: group.items }
  }
  if (group.link) {
    return {
      label: group.label,
      items: [{ label: group.label, link: group.link }],
    }
  }
  return { label: group.label, items: [] }
}

export function toHeaderCategories(groups: NavGroup[]): HeaderCategory[] {
  const byLabel = new Map(groups.map((g) => [g.label, g]))

  return HEADER_CATEGORIES.map(({ label, groups: groupLabels }) => {
    const sections: HeaderCategorySection[] = []
    for (const groupLabel of groupLabels) {
      const group = byLabel.get(groupLabel)
      if (!group) continue
      const section = sectionForGroup(group)
      if (section.items.length) sections.push(section)
    }

    const items = sections.flatMap((section) => section.items)
    const href = items[0]?.link ?? '/'

    return { label, href, items, sections }
  }).filter((category) => category.items.length > 0)
}

export function isCategoryActive(
  category: HeaderCategory,
  currentPath: string
): boolean {
  return category.items.some((item) => item.link === currentPath)
}

export interface DocsNavContext {
  categories: HeaderCategory[]
  category: HeaderCategory | null
  group: NavGroup | null
  items: NavItem[]
  /** True when the active sidebar group label differs from the header category. */
  showGroupLabel: boolean
}

export function resolveDocsNavContext(
  groups: NavGroup[],
  currentPath: string
): DocsNavContext {
  const categories = toHeaderCategories(groups)
  const category =
    categories.find((cat) => isCategoryActive(cat, currentPath)) ??
    categories[0] ??
    null
  const group = findActiveGroup(groups, currentPath)
  const items = getSidebarItems(group)
  const showGroupLabel = Boolean(
    category &&
      group &&
      category.sections.length > 1 &&
      group.label !== category.label
  )

  return { categories, category, group, items, showGroupLabel }
}

export type SidebarContext = Omit<DocsNavContext, 'categories'>

export function resolveSidebarContext(
  groups: NavGroup[],
  currentPath: string
): SidebarContext {
  const { category, group, items, showGroupLabel } = resolveDocsNavContext(
    groups,
    currentPath
  )
  return { category, group, items, showGroupLabel }
}
