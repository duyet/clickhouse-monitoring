import { ChartFailedQueryCount } from './failed-query-count'

describe('<ChartFailedQueryCount />', () => {
  const defaultProps = { hostId: 0, title: 'Failed Query Count' }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartFailedQueryCount {...defaultProps} />)
    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
  })

  it('renders error state when API fails', () => {
    cy.intercept('GET', '/api/v1/charts/failed-query-count*', {
      statusCode: 500,
      body: { error: { message: 'Failed to fetch error logs' } },
    }).as('chartError')
    cy.mount(<ChartFailedQueryCount {...defaultProps} />)
    cy.wait('@chartError')
    cy.contains('Error').should('exist')
  })

  it('renders chart with data', () => {
    cy.intercept('GET', '/api/v1/charts/failed-query-count*', {
      statusCode: 200,
      body: {
        data: [
          { event_time: '2025-01-01', query_count: 15, breakdown: [['Select', '10'], ['Insert', '5']] },
          { event_time: '2025-01-02', query_count: 8, breakdown: [['Select', '6'], ['Insert', '2']] },
        ],
        metadata: { duration: 42, rows: 2 },
      },
    }).as('chartData')
    cy.mount(<ChartFailedQueryCount {...defaultProps} />)
    cy.wait('@chartData')
    cy.get('[data-testid="failed-query-count-chart"]').should('exist')
  })

  it('works with different hostId values', () => {
    cy.intercept('GET', '/api/v1/charts/failed-query-count?hostId=3*', {
      statusCode: 200,
      body: { data: [{ event_time: '2025-01-01', query_count: 5, breakdown: [['Select', '5']] }], metadata: { duration: 22, rows: 1 } },
    }).as('chartData')
    cy.mount(<ChartFailedQueryCount hostId={3} />)
    cy.wait('@chartData')
    cy.get('[data-testid="failed-query-count-chart"]').should('exist')
  })
})
