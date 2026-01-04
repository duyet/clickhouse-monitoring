import { HostVersionWithStatus } from './host-version-status'

describe('<HostVersionWithStatus />', () => {
  const hostId = 0

  it('renders loading state', () => {
    cy.intercept('GET', '/api/v1/host-status?hostId=0*', {
      delay: 1000,
      statusCode: 200,
      body: {
        success: true,
        data: {
          version: '24.3.1.1',
          uptime: '1 day',
          hostname: 'ch-01',
        },
      },
    }).as('hostStatus')

    cy.mount(<HostVersionWithStatus hostId={hostId} />)

    // Should show loading indicator
    cy.contains('Loading...').should('exist')
    cy.get('.animate-pulse').should('exist')

    cy.wait('@hostStatus')
  })

  it('renders online state with version', () => {
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

    cy.mount(<HostVersionWithStatus hostId={hostId} />)

    cy.wait('@hostStatus')

    // Should show version with green indicator
    cy.contains('24.3.1.1').should('exist')
    cy.get('.bg-emerald-500').should('exist')
    cy.contains('Loading...').should('not.exist')
  })

  it('renders offline state', () => {
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

    cy.mount(<HostVersionWithStatus hostId={hostId} />)

    cy.wait('@hostStatus')

    // Should show offline with red indicator
    cy.contains('Offline').should('exist')
    cy.get('.bg-red-400').should('exist')
    cy.contains('Loading...').should('not.exist')
  })

  it('renders offline on API error', () => {
    cy.intercept('GET', '/api/v1/host-status?hostId=0*', {
      statusCode: 500,
      body: { success: false, error: 'Connection failed' },
    }).as('hostStatus')

    cy.mount(<HostVersionWithStatus hostId={hostId} />)

    cy.wait('@hostStatus')

    // Should show offline on error
    cy.contains('Offline').should('exist')
    cy.get('.bg-red-400').should('exist')
  })

  it('works with different hostId values', () => {
    cy.intercept('GET', '/api/v1/host-status?hostId=3*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          version: '23.10.1.1',
          uptime: '10 days',
          hostname: 'ch-03',
        },
      },
    }).as('hostStatus3')

    cy.mount(<HostVersionWithStatus hostId={3} />)

    cy.wait('@hostStatus3')

    cy.contains('23.10.1.1').should('exist')
    cy.get('.bg-emerald-500').should('exist')
  })
})
