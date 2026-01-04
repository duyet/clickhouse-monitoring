import { ChartDisksUsage } from './disks-usage'

describe('<ChartDisksUsage />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Disks Usage',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartDisksUsage {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Disks Usage').should('exist')
  })

  it('renders error state when API fails', () => {
    cy.intercept('GET', '/api/v1/charts/disks-usage*', {
      statusCode: 500,
      body: { error: { message: 'Failed to fetch disk metrics' } },
    }).as('chartError')

    cy.mount(<ChartDisksUsage {...defaultProps} />)

    cy.wait('@chartError')

    cy.contains('Error').should('exist')
    cy.contains('Disks Usage').should('exist')
  })

  it('renders empty state when no data', () => {
    cy.intercept('GET', '/api/v1/charts/disks-usage*', {
      statusCode: 200,
      body: { data: [], metadata: {} },
    }).as('chartEmpty')

    cy.mount(<ChartDisksUsage {...defaultProps} />)

    cy.wait('@chartEmpty')

    cy.contains('No results').should('exist')
  })

  it('renders chart with data - shows both available and used disk space', () => {
    cy.intercept('GET', '/api/v1/charts/disks-usage*', {
      statusCode: 200,
      body: {
        data: [
          {
            event_time: '2025-01-01 00:00:00',
            DiskAvailable_default: 1073741824000,
            DiskUsed_default: 536870912000,
            readable_DiskAvailable_default: '1 TB',
            readable_DiskUsed_default: '500 GB',
          },
          {
            event_time: '2025-01-02 00:00:00',
            DiskAvailable_default: 1073741824000,
            DiskUsed_default: 549453842000,
            readable_DiskAvailable_default: '1 TB',
            readable_DiskUsed_default: '511.5 GB',
          },
          {
            event_time: '2025-01-03 00:00:00',
            DiskAvailable_default: 1073741824000,
            DiskUsed_default: 558345740000,
            readable_DiskAvailable_default: '1 TB',
            readable_DiskUsed_default: '520 GB',
          },
        ],
        metadata: {
          duration: 52,
          rows: 3,
          sql: 'SELECT ... FROM system.disks',
        },
      },
    }).as('chartData')

    cy.mount(<ChartDisksUsage {...defaultProps} />)

    cy.wait('@chartData')

    cy.get('[data-testid="disk-usage-chart"]').should('exist')
    cy.get('svg').should('exist')

    cy.get('.recharts-area').should('have.length.at.least', 2)
  })

  it('applies custom className', () => {
    cy.mount(
      <ChartDisksUsage {...defaultProps} className="custom-test-class" />
    )

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.intercept('GET', '/api/v1/charts/disks-usage?hostId=1*', {
      statusCode: 200,
      body: {
        data: [
          {
            event_time: '2025-01-01 00:00:00',
            DiskAvailable_default: 536870912000,
            DiskUsed_default: 268435456000,
            readable_DiskAvailable_default: '500 GB',
            readable_DiskUsed_default: '250 GB',
          },
        ],
        metadata: { duration: 32, rows: 1 },
      },
    }).as('chartDataHost1')

    cy.mount(<ChartDisksUsage hostId={1} title="Host 1 Disks" />)

    cy.wait('@chartDataHost1')

    cy.contains('Host 1 Disks').should('exist')
  })
})
