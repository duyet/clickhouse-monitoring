import { Menu } from './menu'
import type { MenuItem } from './types'

const items: MenuItem[] = [
  {
    title: 'Item 1',
    href: '/item-1',
  },
  {
    title: 'Item 2',
    href: '/item-2',
    description: 'Item 2 description',
  },
]

describe('<Menu />', () => {
  it('renders on Macbook', () => {
    // On macbook-16, the menu should be <MenuNavigationStyle />
    cy.viewport('macbook-16')
    cy.mount(<Menu items={items} />)
    cy.get('a').should('have.length', 2)
  })

  it('renders on iPhone', () => {
    // On iphone-x, the menu should be <MenuDropdownStyle />
    cy.viewport('iphone-x')
    cy.mount(<Menu items={items} />)
    cy.get('button').should('be.visible')
  })

  it('responsive', () => {
    cy.mount(<Menu items={items} />)

    // On iphone-x, the menu should be <MenuDropdownStyle />
    cy.viewport('iphone-x')
    cy.get('button').should('be.visible')

    // On macbook-16, the menu should be <MenuNavigationStyle />
    cy.viewport('macbook-16')
    cy.get('button').should('not.be.visible')
    cy.get('a').should('have.length', 2)
  })
})
