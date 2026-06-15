import { findActiveGroup, getSidebarItems, type NavGroup } from './header-nav'

export function resolveDocsBreadcrumb(
  groups: NavGroup[],
  currentSlug: string,
  pageTitle: string
): string {
  const current = currentSlug ? `/${currentSlug}` : '/'
  const activeGroup = findActiveGroup(groups, current)
  const items = getSidebarItems(activeGroup)
  const activeItem = items.find((entry) => entry.link === current)

  if (activeGroup && activeItem) {
    return `${activeGroup.label} / ${activeItem.label}`
  }

  if (activeGroup?.link === current) {
    return activeGroup.label
  }

  return pageTitle
}
