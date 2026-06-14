import { menuItemsConfig } from '@/menu'

import type { MenuItem } from './types'

import { MenuNavigationStyle } from './menu-navigation-style'

export interface MenuProps {
  items?: MenuItem[]
}

export const Menu = function Menu({ items = menuItemsConfig }: MenuProps) {
  return (
    <MenuNavigationStyle
      key="navigation-menu"
      className="hidden transition md:flex"
      items={items}
    />
  )
}
