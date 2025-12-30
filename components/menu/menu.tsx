import { memo } from 'react'
import { menuItemsConfig } from '@/menu'
import { MenuNavigationStyle } from './menu-navigation-style'
import type { MenuItem } from './types'

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
