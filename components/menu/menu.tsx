import { menuItemsConfig } from '@/menu'

import type { MenuItem } from './types'

import { MenuNavigationStyle } from './menu-navigation-style'
import { memo } from 'react'

export interface MenuProps {
  items?: MenuItem[]
}

export const Menu = memo(function Menu({ items = menuItemsConfig }: MenuProps) {
  return (
    <MenuNavigationStyle
      key="navigation-menu"
      className="hidden transition md:flex"
      items={items}
    />
  )
})
