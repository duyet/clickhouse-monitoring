import { menuItemsConfig } from '../../menu'
import { MenuDropdownStyle } from './menu-dropdown-style'
import { MenuNavigationStyle } from './menu-navigation-style'
import { type MenuItem } from './types'

export interface MenuProps {
  items?: MenuItem[]
}

export function Menu({ items = menuItemsConfig }: MenuProps) {
  return (
    <>
      <MenuNavigationStyle className="hidden md:flex" items={items} />
      <MenuDropdownStyle className="flex md:hidden" items={items} />
    </>
  )
}
