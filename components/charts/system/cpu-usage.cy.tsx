import { ChartCPUUsage } from './cpu-usage'

describe('<ChartCPUUsage />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'CPU Usage',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartCPUUsage {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('CPU Usage').should('exist')
  })

  it('renders error state when API fails', () => {
    cy.intercept('GET', '/api/v1/charts/cpu-usage*', {
      statusCode: 500,
      body: { error: { message: 'Failed to fetch CPU metrics' } },
    }).as('chartError')

    cy.mount(<ChartCPUUsage {...defaultProps} />)

    cy.wait('@chartError')

    cy.contains('Error').should('exist')
    cy.contains('CPU Usage').should('exist')
  })

  it('renders empty state when no data', () => {
    cy.intercept('GET', '/api/v1/charts/cpu-usage*', {
      statusCode: 200,
      body: { data: [], metadata: {} },
    }).as('chartEmpty')

    cy.mount(<ChartCPUUsage {...defaultProps} />)

    cy.wait('@chartEmpty')

    cy.contains('No results').should('exist')
  })

  it('renders chart with data', () => {
    cy.intercept('GET', '/api/v1/charts/cpu-usage*', {
      statusCode: 200,
      body: {
        data: [
          {
            event_time: '2025-01-01 00:00:00',
            avg_cpu: 45000000,
          },
          {
            event_time: '2025-01-01 00:10:00',
            avg_cpu: 52000000,
          },
          {
            event_time: '2025-01-01 00:20:00',
            avg_cpu: 38000000,
          },
        ],
        metadata: {
          duration: 42,
          rows: 3,
          sql: 'SELECT ... FROM system.metrics',
        },
      },
    }).as('chartData')

    cy.mount(<ChartCPUUsage {...defaultProps} />)

    cy.wait('@chartData')

    cy.get('[data-testid="cpu-usage-chart"]').should('exist')
    cy.get('svg').should('exist')

    cy.get('.recharts-area').should('have.length.at.least', 1)
  })

  it('applies custom className', () => {
    cy.mount(<ChartCPUUsage {...defaultProps} className="custom-test-class" />)

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.intercept('GET', '/api/v1/charts/cpu-usage?hostId=2*', {
      statusCode: 200,
      body: {
        data: [
          {
            event_time: '2025-01-01 00:00:00',
            avg_cpu: 35000000,
          },
        ],
        metadata: { duration: 28, rows: 1 },
      },
    }).as('chartDataHost2')

    cy.mount(<ChartCPUUsage hostId={2} title="Host 2 CPU" />)

    cy.wait('@chartDataHost2')

    cy.contains('Host 2 CPU').should('exist')
  })
})
