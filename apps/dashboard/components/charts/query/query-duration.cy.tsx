import { ChartQueryDuration } from './query-duration'

describe('<ChartQueryDuration />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Query Duration',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartQueryDuration {...defaultProps} />)
    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Query Duration').should('exist')
  })

  it('renders error state when API fails', () => {
    cy.intercept('GET', '/api/v1/charts/query-duration*', {
      statusCode: 500,
      body: { error: { message: 'Query execution failed' } },
    }).as('chartError')
    cy.mount(<ChartQueryDuration {...defaultProps} />)
    cy.wait('@chartError')
    cy.get('[role="alert"]').should('exist')
  })

  it('renders area chart with data', () => {
    cy.intercept('GET', '/api/v1/charts/query-duration*', {
      statusCode: 200,
      body: {
        data: [
          {
            event_time: '2025-01-01',
            query_duration_s: 1.5,
          },
          {
            event_time: '2025-01-02',
            query_duration_s: 2.3,
          },
        ],
        metadata: { duration: 35, rows: 2 },
      },
    }).as('chartData')
    cy.mount(<ChartQueryDuration {...defaultProps} />)
    cy.wait('@chartData')
    cy.get('[data-testid="query-duration-chart"]').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(<ChartQueryDuration {...defaultProps} className="custom-class" />)
    cy.get('.custom-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.mount(<ChartQueryDuration hostId={2} />)
    cy.contains('Query Duration').should('exist')
  })
})
