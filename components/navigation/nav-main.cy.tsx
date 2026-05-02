import type { MenuItem } from '@/components/menu/types'

import { NavMain } from './nav-main'
import {
  PathnameContext,
  SearchParamsContext,
} from 'next/dist/shared/lib/hooks-client-context.shared-runtime'
import { SidebarProvider } from '@/components/ui/sidebar'

describe('<NavMain />', () => {
  const mountNavMain = (
    items: MenuItem[],
    {
      pathname = '/',
      searchParams = new URLSearchParams('host=0'),
    }: {
      pathname?: string
      searchParams?: URLSearchParams
    } = {}
  ) =>
    cy.mount(
      <PathnameContext.Provider value={pathname}>
        <SearchParamsContext.Provider value={searchParams}>
          <SidebarProvider defaultOpen={true}>
            <NavMain items={items} />
          </SidebarProvider>
        </SearchParamsContext.Provider>
      </PathnameContext.Provider>
    )

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
      // @ts-expect-error - icon mock for testing
      icon: () => <svg data-testid="overview-icon" />,
    },
    {
      title: 'Dashboard',
      href: '/dashboard',
      section: 'main',
      // @ts-expect-error - icon mock for testing
      icon: () => <svg data-testid="dashboard-icon" />,
    },
  ]

  describe('Single item rendering', () => {
    it('renders single menu items without children', () => {
      mountNavMain(singleItems)

      cy.contains('Overview').should('be.visible')
      cy.contains('Dashboard').should('be.visible')
      cy.contains('Main').should('be.visible')
    })

    it('renders correct number of sections', () => {
      mountNavMain(mixedItems)

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

      mountNavMain(mainOnlyItems)

      cy.contains('Main').should('be.visible')
      cy.contains('Others').should('not.exist')
    })

    it('renders icons when provided', () => {
      mountNavMain(itemsWithIcons)

      cy.get('[data-testid="overview-icon"]').should('exist')
      cy.get('[data-testid="dashboard-icon"]').should('exist')
    })
  })

  describe('Collapsible menu groups', () => {
    it('renders collapsible menu items with children', () => {
      mountNavMain(collapsibleItems)

      cy.contains('Queries').should('be.visible')
      cy.contains('Running Queries').should('be.visible')
      cy.contains('Query History').should('be.visible')
    })

    it('opens collapsible by default when active child exists', () => {
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

      mountNavMain(itemsWithActiveChild, { pathname: '/running-queries' })

      // Collapsible should be open by default when child is active
      cy.contains('Running Queries').should('be.visible')
    })

    it('can collapse and expand menu groups', () => {
      mountNavMain(collapsibleItems)

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
    it('highlights active menu item', () => {
      mountNavMain(singleItems, { pathname: '/dashboard' })

      // Active item should have data-active attribute (set by HostPrefixedLink)
      cy.contains('Dashboard')
        .closest('a')
        .should('have.attr', 'data-active', 'true')
    })

    it('highlights parent when child is active', () => {
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

      mountNavMain(itemsWithActiveChild, { pathname: '/running-queries' })

      // Parent button should be marked as active
      cy.contains('Queries').closest('button').should('have.class', 'bg-accent')
    })

    it('marks active child with aria-current', () => {
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

      mountNavMain(itemsWithActiveChild, { pathname: '/running-queries' })

      cy.contains('Running Queries')
        .closest('a')
        .should('have.attr', 'aria-current', 'page')
    })
  })

  describe('Host-prefixed links', () => {
    it('includes host query parameter in links', () => {
      mountNavMain(singleItems)

      cy.contains('Overview')
        .should('have.attr', 'href')
        .and('include', 'host=0')
    })

    it('uses custom host from search params', () => {
      mountNavMain(singleItems, {
        searchParams: new URLSearchParams('host=2'),
      })

      cy.contains('Overview')
        .should('have.attr', 'href')
        .and('include', 'host=2')
    })
  })

  describe('Mobile responsiveness', () => {
    it('renders correctly on mobile viewport', () => {
      cy.viewport('iphone-x')
      mountNavMain(mixedItems)

      cy.contains('Overview').should('be.visible')
      cy.contains('Queries').should('be.visible')
      cy.contains('Settings').should('be.visible')
    })

    it('renders correctly on desktop viewport', () => {
      cy.viewport('macbook-16')
      mountNavMain(mixedItems)

      cy.contains('Overview').should('be.visible')
      cy.contains('Queries').should('be.visible')
      cy.contains('Settings').should('be.visible')
    })

    it('hides text when sidebar is collapsed (icon mode)', () => {
      mountNavMain(singleItems)

      // When sidebar is in icon mode, text should be hidden
      cy.get('[data-sidebar="menu"]').should(
        'have.class',
        'group-data-[collapsible=icon]/sidebar'
      )
    })
  })

  describe('Section labels', () => {
    it('displays correct section labels', () => {
      mountNavMain(mixedItems)

      cy.contains('Main').should('be.visible')
      cy.contains('Others').should('be.visible')
    })

    it('groups items by section correctly', () => {
      mountNavMain(mixedItems)

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
      mountNavMain([])

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

      mountNavMain(itemsWithEmptyChildren)

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

      mountNavMain(deeplyNestedItems)

      cy.contains('Level 1').should('be.visible')
      cy.contains('Level 2').should('be.visible')
    })
  })
})
