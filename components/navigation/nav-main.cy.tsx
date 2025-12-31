import { NavMain } from './nav-main'
import type { MenuItem } from '@/components/menu/types'

// Mock Next.js navigation hooks
const mockUsePathname = cy.stub().returns('/overview')
const mockUseSearchParams = cy.stub().returns({
  get: cy.stub().returns('0'),
  toString: () => 'host=0',
})

// Mock next/navigation hooks
cy.stub(global, 'usePathname', () => mockUsePathname())
cy.stub(global, 'useSearchParams', () => mockUseSearchParams())

describe('<NavMain />', () => {
  const singleItems: MenuItem[] = [
    {
      title: 'Overview',
      href: '/overview',
      section: 'main',
    },
    {
      title: 'Dashboard',
      href: '/dashboard',
      section: 'main',
    },
  ]

  const collapsibleItems: MenuItem[] = [
    {
      title: 'Queries',
      href: '/queries',
      section: 'main',
      items: [
        { title: 'Running Queries', href: '/running-queries' },
        { title: 'Query History', href: '/query-history' },
      ],
    },
  ]

  const mixedItems: MenuItem[] = [
    {
      title: 'Overview',
      href: '/overview',
      section: 'main',
    },
    {
      title: 'Queries',
      href: '/queries',
      section: 'main',
      items: [
        { title: 'Running Queries', href: '/running-queries' },
        { title: 'Query History', href: '/query-history' },
      ],
    },
    {
      title: 'Settings',
      href: '/settings',
      section: 'others',
    },
  ]

  const itemsWithIcons: MenuItem[] = [
    {
      title: 'Overview',
      href: '/overview',
      section: 'main',
      // @ts-ignore - icon mock for testing
      icon: () => <svg data-testid="overview-icon" />,
    },
    {
      title: 'Dashboard',
      href: '/dashboard',
      section: 'main',
      // @ts-ignore - icon mock for testing
      icon: () => <svg data-testid="dashboard-icon" />,
    },
  ]

  describe('Single item rendering', () => {
    it('renders single menu items without children', () => {
      cy.mount(<NavMain items={singleItems} />)

      cy.contains('Overview').should('be.visible')
      cy.contains('Dashboard').should('be.visible')
      cy.contains('Main').should('be.visible')
    })

    it('renders correct number of sections', () => {
      cy.mount(<NavMain items={mixedItems} />)

      cy.contains('Main').should('be.visible')
      cy.contains('Others').should('be.visible')
    })

    it('does not render empty sections', () => {
      const mainOnlyItems: MenuItem[] = [
        {
          title: 'Overview',
          href: '/overview',
          section: 'main',
        },
      ]

      cy.mount(<NavMain items={mainOnlyItems} />)

      cy.contains('Main').should('be.visible')
      cy.contains('Others').should('not.exist')
    })

    it('renders icons when provided', () => {
      cy.mount(<NavMain items={itemsWithIcons} />)

      cy.get('[data-testid="overview-icon"]').should('exist')
      cy.get('[data-testid="dashboard-icon"]').should('exist')
    })
  })

  describe('Collapsible menu groups', () => {
    it('renders collapsible menu items with children', () => {
      cy.mount(<NavMain items={collapsibleItems} />)

      cy.contains('Queries').should('be.visible')
      cy.contains('Running Queries').should('be.visible')
      cy.contains('Query History').should('be.visible')
    })

    it('opens collapsible by default when active child exists', () => {
      mockUsePathname.returns('/running-queries')
      const itemsWithActiveChild: MenuItem[] = [
        {
          title: 'Queries',
          href: '/queries',
          section: 'main',
          items: [
            { title: 'Running Queries', href: '/running-queries' },
            { title: 'Query History', href: '/query-history' },
          ],
        },
      ]

      cy.mount(<NavMain items={itemsWithActiveChild} />)

      // Collapsible should be open by default when child is active
      cy.contains('Running Queries').should('be.visible')
    })

    it('can collapse and expand menu groups', () => {
      cy.mount(<NavMain items={collapsibleItems} />)

      // Initially visible (open by default in this test setup)
      cy.contains('Running Queries').should('be.visible')

      // Click to collapse
      cy.contains('Queries').click()
      cy.contains('Running Queries').should('not.be.visible')

      // Click to expand
      cy.contains('Queries').click()
      cy.contains('Running Queries').should('be.visible')
    })
  })

  describe('Active state highlighting', () => {
    beforeEach(() => {
      mockUsePathname.returns('/dashboard')
    })

    it('highlights active menu item', () => {
      cy.mount(<NavMain items={singleItems} />)

      // Active item should have data-active attribute (set by HostPrefixedLink)
      cy.contains('Dashboard')
        .closest('a')
        .should('have.attr', 'data-active', 'true')
    })

    it('highlights parent when child is active', () => {
      mockUsePathname.returns('/running-queries')
      const itemsWithActiveChild: MenuItem[] = [
        {
          title: 'Queries',
          href: '/queries',
          section: 'main',
          items: [
            { title: 'Running Queries', href: '/running-queries' },
            { title: 'Query History', href: '/query-history' },
          ],
        },
      ]

      cy.mount(<NavMain items={itemsWithActiveChild} />)

      // Parent button should be marked as active
      cy.contains('Queries').closest('button').should('have.class', 'bg-accent')
    })

    it('marks active child with aria-current', () => {
      mockUsePathname.returns('/running-queries')
      const itemsWithActiveChild: MenuItem[] = [
        {
          title: 'Queries',
          href: '/queries',
          section: 'main',
          items: [
            { title: 'Running Queries', href: '/running-queries' },
            { title: 'Query History', href: '/query-history' },
          ],
        },
      ]

      cy.mount(<NavMain items={itemsWithActiveChild} />)

      cy.contains('Running Queries')
        .closest('a')
        .should('have.attr', 'aria-current', 'page')
    })
  })

  describe('Host-prefixed links', () => {
    it('includes host query parameter in links', () => {
      cy.mount(<NavMain items={singleItems} />)

      cy.contains('Overview')
        .should('have.attr', 'href')
        .and('include', 'host=0')
    })

    it('uses custom host from search params', () => {
      const mockSearchParams = cy.stub().returns({
        get: cy.stub().returns('2'),
        toString: () => 'host=2',
      })

      cy.stub(global, 'useSearchParams', () => mockSearchParams)

      cy.mount(<NavMain items={singleItems} />)

      cy.contains('Overview')
        .should('have.attr', 'href')
        .and('include', 'host=2')
    })
  })

  describe('Mobile responsiveness', () => {
    it('renders correctly on mobile viewport', () => {
      cy.viewport('iphone-x')
      cy.mount(<NavMain items={mixedItems} />)

      cy.contains('Overview').should('be.visible')
      cy.contains('Queries').should('be.visible')
      cy.contains('Settings').should('be.visible')
    })

    it('renders correctly on desktop viewport', () => {
      cy.viewport('macbook-16')
      cy.mount(<NavMain items={mixedItems} />)

      cy.contains('Overview').should('be.visible')
      cy.contains('Queries').should('be.visible')
      cy.contains('Settings').should('be.visible')
    })

    it('hides text when sidebar is collapsed (icon mode)', () => {
      cy.mount(<NavMain items={singleItems} />)

      // When sidebar is in icon mode, text should be hidden
      cy.get('[data-sidebar="menu"]').should(
        'have.class',
        'group-data-[collapsible=icon]/sidebar'
      )
    })
  })

  describe('Section labels', () => {
    it('displays correct section labels', () => {
      cy.mount(<NavMain items={mixedItems} />)

      cy.contains('Main').should('be.visible')
      cy.contains('Others').should('be.visible')
    })

    it('groups items by section correctly', () => {
      cy.mount(<NavMain items={mixedItems} />)

      // Main section should contain Overview and Queries
      cy.contains('Main')
        .parent()
        .parent()
        .contains('Overview')
        .should('be.visible')
      cy.contains('Main')
        .parent()
        .parent()
        .contains('Queries')
        .should('be.visible')

      // Others section should contain Settings
      cy.contains('Others')
        .parent()
        .parent()
        .contains('Settings')
        .should('be.visible')
    })
  })

  describe('Edge cases', () => {
    it('renders empty state when no items provided', () => {
      cy.mount(<NavMain items={[]} />)

      cy.contains('Main').should('not.exist')
      cy.contains('Others').should('not.exist')
    })

    it('handles items with empty children array', () => {
      const itemsWithEmptyChildren: MenuItem[] = [
        {
          title: 'Empty Group',
          href: '/empty',
          section: 'main',
          items: [],
        },
      ]

      cy.mount(<NavMain items={itemsWithEmptyChildren} />)

      // Should render as single item when children array is empty
      cy.contains('Empty Group').should('be.visible')
    })

    it('handles deeply nested menu structures', () => {
      // Note: Current implementation only supports 2 levels, but test for extensibility
      const deeplyNestedItems: MenuItem[] = [
        {
          title: 'Level 1',
          href: '/level1',
          section: 'main',
          items: [
            {
              title: 'Level 2',
              href: '/level2',
              items: [
                // This level won't be rendered with current implementation
                { title: 'Level 3', href: '/level3' },
              ],
            },
          ],
        },
      ]

      cy.mount(<NavMain items={deeplyNestedItems} />)

      cy.contains('Level 1').should('be.visible')
      cy.contains('Level 2').should('be.visible')
    })
  })
})
