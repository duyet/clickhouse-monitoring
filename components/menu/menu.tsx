import { menuItemsConfig } from '@/menu'
import { MenuDropdownStyle } from './menu-dropdown-style'
import { MenuNavigationStyle } from './menu-navigation-style'
import { type MenuItem } from './types'

export interface MenuProps {
  items?: MenuItem[]
}

export function Menu({ items = menuItemsConfig }: MenuProps) {
  return (
    <>
      <MenuNavigationStyle
        className="hidden transition md:flex"
        items={items}
      />
      <MenuDropdownStyle className="flex transition md:hidden" items={items} />
    </>
  )
}
