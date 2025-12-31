import { ChartMergeAvgDuration } from './merge-avg-duration'

describe('<ChartMergeAvgDuration />', () => {
  const defaultProps = { hostId: 0, title: 'Merge Average Duration' }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartMergeAvgDuration {...defaultProps} />)
    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
  })

  it('renders error state when API fails', () => {
    cy.intercept('GET', '/api/v1/charts/merge-avg-duration*', {
      statusCode: 500,
      body: { error: { message: 'Failed to fetch merge duration' } },
    }).as('chartError')
    cy.mount(<ChartMergeAvgDuration {...defaultProps} />)
    cy.wait('@chartError')
    cy.contains('Error').should('exist')
  })

  it('renders chart with data', () => {
    cy.intercept('GET', '/api/v1/charts/merge-avg-duration*', {
      statusCode: 200,
      body: {
        data: [
          {
            event_time: '2025-01-01',
            avg_duration_ms: 5500,
            readable_avg_duration_ms: '5.50s',
            bar: 1,
          },
          {
            event_time: '2025-01-02',
            avg_duration_ms: 7200,
            readable_avg_duration_ms: '7.20s',
            bar: 1,
          },
        ],
        metadata: { duration: 48, rows: 2 },
      },
    }).as('chartData')
    cy.mount(<ChartMergeAvgDuration {...defaultProps} />)
    cy.wait('@chartData')
    cy.get('[data-testid="merge-avg-duration-chart"]').should('exist')
  })

  it('works with different hostId values', () => {
    cy.intercept('GET', '/api/v1/charts/merge-avg-duration?hostId=2*', {
      statusCode: 200,
      body: {
        data: [
          {
            event_time: '2025-01-01',
            avg_duration_ms: 3200,
            readable_avg_duration_ms: '3.20s',
            bar: 1,
          },
        ],
        metadata: { duration: 26, rows: 1 },
      },
    }).as('chartData')
    cy.mount(<ChartMergeAvgDuration hostId={2} />)
    cy.wait('@chartData')
    cy.get('[data-testid="merge-avg-duration-chart"]').should('exist')
  })
})
