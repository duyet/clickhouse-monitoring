type NavItem = { label: string; link: string }
type NavGroup = { label: string; link?: string; items?: NavItem[] }

export function resolveDocsBreadcrumb(
  groups: NavGroup[],
  currentSlug: string,
  pageTitle: string
): string {
  const current = currentSlug ? `/${currentSlug}` : '/'

  for (const group of groups) {
    if (group.items) {
      const item = group.items.find((entry) => entry.link === current)
      if (item) {
        return `${group.label} / ${item.label}`
      }
      continue
    }

    if (group.link === current) {
      return group.label
    }
  }

  return pageTitle
}
