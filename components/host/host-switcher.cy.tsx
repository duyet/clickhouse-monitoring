import { HostSwitcher } from './host-switcher'
import { SidebarProvider } from '@/components/ui/sidebar'

const mockHosts = [
  {
    id: 0,
    name: 'Production',
    host: 'prod.clickhouse.internal',
    user: 'default',
  },
  {
    id: 1,
    name: 'Staging',
    host: 'staging.clickhouse.internal',
    user: 'default',
  },
  { id: 2, name: '', host: 'http://localhost:8123', user: 'admin' },
]

const mountWithSidebar = (defaultOpen = true) =>
  cy.mount(
    <SidebarProvider defaultOpen={defaultOpen}>
      <HostSwitcher />
    </SidebarProvider>
  )

describe('<HostSwitcher /> - dropdown items use HostMenuRow', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/v1/hosts', {
      statusCode: 200,
      body: { success: true, data: mockHosts },
    }).as('hosts')

    cy.intercept('GET', '/api/v1/host-status?hostId=0*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          version: '24.3.1.1',
          uptime: '2 days',
          hostname: 'prod.clickhouse.internal',
        },
      },
    }).as('hostStatus0')

    cy.intercept('GET', '/api/v1/host-status?hostId=1*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          version: '24.2.1.1',
          uptime: '5 hours',
          hostname: 'staging.clickhouse.internal',
        },
      },
    }).as('hostStatus1')

    cy.intercept('GET', '/api/v1/host-status?hostId=2*', {
      statusCode: 200,
      body: {
        success: true,
        data: { version: '', uptime: '', hostname: '' },
      },
    }).as('hostStatus2')
  })

  it('renders one dropdown item per configured host', () => {
    mountWithSidebar()

    cy.wait('@hosts')

    cy.get('[data-testid="host-switcher"]').click()

    cy.get('[data-testid="host-option-0"]').should('exist')
    cy.get('[data-testid="host-option-1"]').should('exist')
    cy.get('[data-testid="host-option-2"]').should('exist')
  })

  it('each dropdown item shows the host name via HostMenuRow', () => {
    mountWithSidebar()

    cy.wait('@hosts')

    cy.get('[data-testid="host-switcher"]').click()

    cy.get('[data-testid="host-option-0"]')
      .contains('Production')
      .should('exist')
    cy.get('[data-testid="host-option-1"]').contains('Staging').should('exist')
  })

  it('falls back to hostname when host name is empty', () => {
    mountWithSidebar()

    cy.wait('@hosts')

    cy.get('[data-testid="host-switcher"]').click()

    // Host 2 has no name, should show extracted host
    cy.get('[data-testid="host-option-2"]')
      .contains('localhost:8123')
      .should('exist')
  })

  it('shows version and uptime for each online host in the dropdown', () => {
    mountWithSidebar()

    cy.wait('@hosts')

    cy.get('[data-testid="host-switcher"]').click()

    cy.wait('@hostStatus0')
    cy.wait('@hostStatus1')

    cy.get('[data-testid="host-option-0"]').contains('24.3.1.1').should('exist')
    cy.get('[data-testid="host-option-0"]').contains('2d').should('exist')

    cy.get('[data-testid="host-option-1"]').contains('24.2.1.1').should('exist')
    cy.get('[data-testid="host-option-1"]').contains('5h').should('exist')
  })

  it('shows Offline for hosts that are down', () => {
    mountWithSidebar()

    cy.wait('@hosts')

    cy.get('[data-testid="host-switcher"]').click()

    cy.wait('@hostStatus2')

    cy.get('[data-testid="host-option-2"]').contains('Offline').should('exist')
  })

  it('marks the active host with a visible check mark (opacity-100)', () => {
    // SearchParamsContext is seeded with host=0, so index 0 is active
    mountWithSidebar()

    cy.wait('@hosts')

    cy.get('[data-testid="host-switcher"]').click()

    // The active host's HostMenuRow check icon should be fully visible
    cy.get('[data-testid="host-option-0"]').find('.opacity-100').should('exist')
  })

  it('hides the check mark for inactive hosts (opacity-0)', () => {
    mountWithSidebar()

    cy.wait('@hosts')

    cy.get('[data-testid="host-switcher"]').click()

    // Inactive hosts should have the check icon hidden
    cy.get('[data-testid="host-option-1"]').find('.opacity-0').should('exist')
    cy.get('[data-testid="host-option-2"]').find('.opacity-0').should('exist')
  })

  it('shows status dot for each host in the dropdown', () => {
    mountWithSidebar()

    cy.wait('@hosts')

    cy.get('[data-testid="host-switcher"]').click()

    cy.wait('@hostStatus0')
    cy.wait('@hostStatus1')
    cy.wait('@hostStatus2')

    // Online hosts have green dot
    cy.get('[data-testid="host-option-0"]')
      .find('.bg-emerald-500')
      .should('exist')
    cy.get('[data-testid="host-option-1"]')
      .find('.bg-emerald-500')
      .should('exist')

    // Offline host has red dot
    cy.get('[data-testid="host-option-2"]').find('.bg-red-400').should('exist')
  })
})
