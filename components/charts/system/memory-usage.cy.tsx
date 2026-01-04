import { ChartMemoryUsage } from './memory-usage'

describe('<ChartMemoryUsage />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Memory Usage',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartMemoryUsage {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Memory Usage').should('exist')
  })

  it('renders error state when API fails', () => {
    cy.intercept('GET', '/api/v1/charts/memory-usage*', {
      statusCode: 500,
      body: { error: { message: 'Failed to fetch memory metrics' } },
    }).as('chartError')

    cy.mount(<ChartMemoryUsage {...defaultProps} />)

    cy.wait('@chartError')

    cy.contains('Error').should('exist')
    cy.contains('Memory Usage').should('exist')
  })

  it('renders empty state when no data', () => {
    cy.intercept('GET', '/api/v1/charts/memory-usage*', {
      statusCode: 200,
      body: { data: [], metadata: {} },
    }).as('chartEmpty')

    cy.mount(<ChartMemoryUsage {...defaultProps} />)

    cy.wait('@chartEmpty')

    cy.contains('No results').should('exist')
  })

  it('renders chart with data', () => {
    cy.intercept('GET', '/api/v1/charts/memory-usage*', {
      statusCode: 200,
      body: {
        data: [
          {
            event_time: '2025-01-01 00:00:00',
            avg_memory: 8589934592,
            readable_avg_memory: '8 GB',
          },
          {
            event_time: '2025-01-01 00:10:00',
            avg_memory: 12884901888,
            readable_avg_memory: '12 GB',
          },
          {
            event_time: '2025-01-01 00:20:00',
            avg_memory: 7516192768,
            readable_avg_memory: '7 GB',
          },
        ],
        metadata: {
          duration: 45,
          rows: 3,
          sql: 'SELECT ... FROM system.metrics',
        },
      },
    }).as('chartData')

    cy.mount(<ChartMemoryUsage {...defaultProps} />)

    cy.wait('@chartData')

    cy.get('[data-testid="memory-usage-chart"]').should('exist')
    cy.get('svg').should('exist')

    cy.get('.recharts-area').should('have.length.at.least', 1)
  })

  it('applies custom className', () => {
    cy.mount(
      <ChartMemoryUsage {...defaultProps} className="custom-test-class" />
    )

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.intercept('GET', '/api/v1/charts/memory-usage?hostId=1*', {
      statusCode: 200,
      body: {
        data: [
          {
            event_time: '2025-01-01 00:00:00',
            avg_memory: 4294967296,
            readable_avg_memory: '4 GB',
          },
        ],
        metadata: { duration: 30, rows: 1 },
      },
    }).as('chartDataHost1')

    cy.mount(<ChartMemoryUsage hostId={1} title="Host 1 Memory" />)

    cy.wait('@chartDataHost1')

    cy.contains('Host 1 Memory').should('exist')
  })
})
