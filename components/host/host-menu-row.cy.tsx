import { HostMenuRow } from './host-menu-row'

describe('<HostMenuRow />', () => {
  const hostId = 0

  // ── Loading state ────────────────────────────────────────────────────────────

  it('shows host name during loading', () => {
    cy.intercept('GET', '/api/v1/host-status?hostId=0*', {
      delay: 1000,
      statusCode: 200,
      body: {
        success: true,
        data: { version: '24.3.1.1', uptime: '1 day', hostname: 'ch-01' },
      },
    }).as('hostStatus')

    cy.mount(
      <HostMenuRow hostId={hostId} hostName="Production" isActive={false} />
    )

    cy.contains('Production').should('exist')

    cy.wait('@hostStatus')
  })

  it('shows pulsing gray dot during loading', () => {
    cy.intercept('GET', '/api/v1/host-status?hostId=0*', {
      delay: 1000,
      statusCode: 200,
      body: {
        success: true,
        data: { version: '24.3.1.1', uptime: '1 day', hostname: 'ch-01' },
      },
    }).as('hostStatus')

    cy.mount(
      <HostMenuRow hostId={hostId} hostName="Production" isActive={false} />
    )

    cy.get('.bg-gray-400.animate-pulse').should('exist')

    cy.wait('@hostStatus')
  })

  it('shows skeleton placeholder during loading', () => {
    cy.intercept('GET', '/api/v1/host-status?hostId=0*', {
      delay: 1000,
      statusCode: 200,
      body: {
        success: true,
        data: { version: '24.3.1.1', uptime: '1 day', hostname: 'ch-01' },
      },
    }).as('hostStatus')

    cy.mount(
      <HostMenuRow hostId={hostId} hostName="Production" isActive={false} />
    )

    // Skeleton is rendered while loading (not version/uptime text)
    cy.contains('Offline').should('not.exist')
    cy.contains('24.3.1.1').should('not.exist')

    cy.wait('@hostStatus')
  })

  it('shows Checking... tooltip while loading', () => {
    cy.intercept('GET', '/api/v1/host-status?hostId=0*', {
      delay: 1000,
      statusCode: 200,
      body: {
        success: true,
        data: { version: '24.3.1.1', uptime: '1 day', hostname: 'ch-01' },
      },
    }).as('hostStatus')

    cy.mount(
      <HostMenuRow hostId={hostId} hostName="Production" isActive={false} />
    )

    cy.get('.bg-gray-400.animate-pulse').should(
      'have.attr',
      'title',
      'Checking...'
    )

    cy.wait('@hostStatus')
  })

  // ── Online state ─────────────────────────────────────────────────────────────

  it('shows green dot when online', () => {
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

    cy.mount(
      <HostMenuRow hostId={hostId} hostName="Production" isActive={false} />
    )

    cy.wait('@hostStatus')

    cy.get('.bg-emerald-500').should('exist')
    cy.get('.bg-red-400').should('not.exist')
    cy.get('.animate-pulse').should('not.exist')
  })

  it('shows host name when online', () => {
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

    cy.mount(
      <HostMenuRow hostId={hostId} hostName="My Cluster" isActive={false} />
    )

    cy.wait('@hostStatus')

    cy.contains('My Cluster').should('exist')
  })

  it('shows version when online', () => {
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

    cy.mount(
      <HostMenuRow hostId={hostId} hostName="Production" isActive={false} />
    )

    cy.wait('@hostStatus')

    cy.contains('24.3.1.1').should('exist')
  })

  it('shows uptime when online', () => {
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

    cy.mount(
      <HostMenuRow hostId={hostId} hostName="Production" isActive={false} />
    )

    cy.wait('@hostStatus')

    cy.contains('1d 2h').should('exist')
  })

  it('shows dot separator between version and uptime when online', () => {
    cy.intercept('GET', '/api/v1/host-status?hostId=0*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          version: '24.3.1.1',
          uptime: '5 hours',
          hostname: 'clickhouse-01',
        },
      },
    }).as('hostStatus')

    cy.mount(
      <HostMenuRow hostId={hostId} hostName="Production" isActive={false} />
    )

    cy.wait('@hostStatus')

    cy.get('.opacity-40').should('exist')
  })

  it('shows hostname and uptime in tooltip when online', () => {
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

    cy.mount(
      <HostMenuRow hostId={hostId} hostName="Production" isActive={false} />
    )

    cy.wait('@hostStatus')

    // StatusIndicator renders title as array joined with ' - '
    cy.get('.bg-emerald-500').should(
      'have.attr',
      'title',
      'Host: clickhouse-01 - Uptime: 1 day 2 hours'
    )
  })

  // ── Offline state ─────────────────────────────────────────────────────────────

  it('shows red dot when offline', () => {
    cy.intercept('GET', '/api/v1/host-status?hostId=0*', {
      statusCode: 200,
      body: {
        success: true,
        data: { version: '', uptime: '', hostname: '' },
      },
    }).as('hostStatus')

    cy.mount(
      <HostMenuRow hostId={hostId} hostName="Production" isActive={false} />
    )

    cy.wait('@hostStatus')

    cy.get('.bg-red-400').should('exist')
    cy.get('.bg-emerald-500').should('not.exist')
  })

  it('shows Offline text when offline', () => {
    cy.intercept('GET', '/api/v1/host-status?hostId=0*', {
      statusCode: 200,
      body: {
        success: true,
        data: { version: '', uptime: '', hostname: '' },
      },
    }).as('hostStatus')

    cy.mount(
      <HostMenuRow hostId={hostId} hostName="Production" isActive={false} />
    )

    cy.wait('@hostStatus')

    cy.contains('Offline').should('exist')
  })

  it('does not show version or uptime when offline', () => {
    cy.intercept('GET', '/api/v1/host-status?hostId=0*', {
      statusCode: 200,
      body: {
        success: true,
        data: { version: '', uptime: '', hostname: '' },
      },
    }).as('hostStatus')

    cy.mount(
      <HostMenuRow hostId={hostId} hostName="Production" isActive={false} />
    )

    cy.wait('@hostStatus')

    cy.get('.opacity-40').should('not.exist')
  })

  it('shows Offline tooltip when offline', () => {
    cy.intercept('GET', '/api/v1/host-status?hostId=0*', {
      statusCode: 200,
      body: {
        success: true,
        data: { version: '', uptime: '', hostname: '' },
      },
    }).as('hostStatus')

    cy.mount(
      <HostMenuRow hostId={hostId} hostName="Production" isActive={false} />
    )

    cy.wait('@hostStatus')

    cy.get('.bg-red-400').should('have.attr', 'title', 'Offline')
  })

  it('shows Offline when API returns an error', () => {
    cy.intercept('GET', '/api/v1/host-status?hostId=0*', {
      statusCode: 500,
      body: { success: false, error: 'Connection failed' },
    }).as('hostStatus')

    cy.mount(
      <HostMenuRow hostId={hostId} hostName="Production" isActive={false} />
    )

    cy.wait('@hostStatus')

    cy.contains('Offline').should('exist')
    cy.get('.bg-red-400').should('exist')
  })

  it('shows host name when offline', () => {
    cy.intercept('GET', '/api/v1/host-status?hostId=0*', {
      statusCode: 200,
      body: {
        success: true,
        data: { version: '', uptime: '', hostname: '' },
      },
    }).as('hostStatus')

    cy.mount(
      <HostMenuRow hostId={hostId} hostName="Staging DB" isActive={false} />
    )

    cy.wait('@hostStatus')

    cy.contains('Staging DB').should('exist')
  })

  // ── Active / inactive check mark ─────────────────────────────────────────────

  it('shows check mark with full opacity when active', () => {
    cy.intercept('GET', '/api/v1/host-status?hostId=0*', {
      statusCode: 200,
      body: {
        success: true,
        data: { version: '24.3.1.1', uptime: '1 day', hostname: 'ch-01' },
      },
    }).as('hostStatus')

    cy.mount(
      <HostMenuRow hostId={hostId} hostName="Production" isActive={true} />
    )

    cy.wait('@hostStatus')

    // The Check icon wrapper should have opacity-100 (not opacity-0)
    cy.get('.opacity-100').should('exist')
    cy.get('.opacity-0').should('not.exist')
  })

  it('hides check mark when not active', () => {
    cy.intercept('GET', '/api/v1/host-status?hostId=0*', {
      statusCode: 200,
      body: {
        success: true,
        data: { version: '24.3.1.1', uptime: '1 day', hostname: 'ch-01' },
      },
    }).as('hostStatus')

    cy.mount(
      <HostMenuRow hostId={hostId} hostName="Production" isActive={false} />
    )

    cy.wait('@hostStatus')

    cy.get('.opacity-0').should('exist')
    cy.get('.opacity-100').should('not.exist')
  })

  it('check mark is hidden regardless of online/offline state when inactive', () => {
    cy.intercept('GET', '/api/v1/host-status?hostId=0*', {
      statusCode: 200,
      body: {
        success: true,
        data: { version: '', uptime: '', hostname: '' },
      },
    }).as('hostStatus')

    cy.mount(
      <HostMenuRow hostId={hostId} hostName="Production" isActive={false} />
    )

    cy.wait('@hostStatus')

    cy.get('.opacity-0').should('exist')
  })

  // ── Different hostId (boundary) ──────────────────────────────────────────────

  it('uses the correct hostId in the API request', () => {
    cy.intercept('GET', '/api/v1/host-status?hostId=7*', {
      statusCode: 200,
      body: {
        success: true,
        data: { version: '23.8.1.1', uptime: '7 days', hostname: 'ch-07' },
      },
    }).as('hostStatus7')

    cy.mount(<HostMenuRow hostId={7} hostName="Analytics" isActive={false} />)

    cy.wait('@hostStatus7')

    cy.contains('23.8.1.1').should('exist')
    cy.contains('7d').should('exist')
    cy.get('.bg-emerald-500').should('exist')
  })

  // ── Regression: host name always visible ─────────────────────────────────────

  it('always displays the host name prop regardless of status', () => {
    // Test with a delayed response to verify name shown in all states
    cy.intercept('GET', '/api/v1/host-status?hostId=0*', {
      delay: 500,
      statusCode: 200,
      body: {
        success: true,
        data: { version: '24.3.1.1', uptime: '1 hour', hostname: 'ch-01' },
      },
    }).as('hostStatus')

    cy.mount(
      <HostMenuRow
        hostId={hostId}
        hostName="Always Visible Name"
        isActive={false}
      />
    )

    // Name visible before data loads
    cy.contains('Always Visible Name').should('exist')

    cy.wait('@hostStatus')

    // Name still visible after data loads
    cy.contains('Always Visible Name').should('exist')
  })
})
