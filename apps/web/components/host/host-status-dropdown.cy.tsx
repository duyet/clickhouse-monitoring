import { HostStatusDropdown } from './host-status-dropdown'

describe('<HostStatusDropdown />', () => {
  const hostId = 0

  beforeEach(() => {
    // Stub SWR's internal cache and fetcher
    cy.window().then((win) => {
      // @ts-expect-error - Adding mock data to window for testing
      win.__SWR_CACHE__ = {}
    })
  })

  it('renders online status indicator', () => {
    cy.intercept('GET', '/api/v1/host-status?hostId=0*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          version: '24.3.1.1',
          uptime: '1 day 2 hours',
          hostname: 'clickhouse-01',
        },
      },
    }).as('hostStatus')

    cy.mount(<HostStatusDropdown hostId={hostId} />)

    cy.wait('@hostStatus')

    // Should show green online indicator
    cy.get('.bg-emerald-500').should('exist')
    cy.get('.bg-emerald-500').should('have.attr', 'title', 'Online')
  })

  it('renders offline status indicator', () => {
    cy.intercept('GET', '/api/v1/host-status?hostId=0*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          version: '',
          uptime: '',
          hostname: '',
        },
      },
    }).as('hostStatus')

    cy.mount(<HostStatusDropdown hostId={hostId} />)

    cy.wait('@hostStatus')

    // Should show red offline indicator
    cy.get('.bg-red-400').should('exist')
    cy.get('.bg-red-400').should('have.attr', 'title', 'Offline')
  })

  it('renders offline on API error', () => {
    cy.intercept('GET', '/api/v1/host-status?hostId=0*', {
      statusCode: 500,
      body: { success: false, error: 'Connection failed' },
    }).as('hostStatus')

    cy.mount(<HostStatusDropdown hostId={hostId} />)

    cy.wait('@hostStatus')

    // Should show red offline indicator on error
    cy.get('.bg-red-400').should('exist')
  })

  it('works with different hostId values', () => {
    cy.intercept('GET', '/api/v1/host-status?hostId=5*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          version: '24.2.1.1',
          uptime: '5 hours',
          hostname: 'clickhouse-05',
        },
      },
    }).as('hostStatus5')

    cy.mount(<HostStatusDropdown hostId={5} />)

    cy.wait('@hostStatus5')

    cy.get('.bg-emerald-500').should('exist')
  })
})
