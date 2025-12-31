import { ChartMergeCount } from './merge-count'

describe('<ChartMergeCount />', () => {
  const defaultProps = { hostId: 0, title: 'Merge Count' }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartMergeCount {...defaultProps} />)
    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
  })

  it('renders error state when API fails', () => {
    cy.intercept('GET', '/api/v1/charts/merge-count*', {
      statusCode: 500,
      body: { error: { message: 'Failed to fetch merge data' } },
    }).as('chartError')
    cy.mount(<ChartMergeCount {...defaultProps} />)
    cy.wait('@chartError')
    cy.contains('Error').should('exist')
  })

  it('renders chart with data', () => {
    cy.intercept('GET', '/api/v1/charts/merge-count*', {
      statusCode: 200,
      body: {
        data: [
          { event_time: '2025-01-01 00:00:00', avg_CurrentMetric_Merge: 150, avg_CurrentMetric_PartMutation: 25 },
          { event_time: '2025-01-01 00:05:00', avg_CurrentMetric_Merge: 160, avg_CurrentMetric_PartMutation: 30 },
        ],
        metadata: { duration: 55, rows: 2 },
      },
    }).as('chartData')
    cy.mount(<ChartMergeCount {...defaultProps} />)
    cy.wait('@chartData')
    cy.get('[data-testid="merge-count-chart"]').should('exist')
  })

  it('displays links to merges and mutations pages', () => {
    cy.intercept('GET', '/api/v1/charts/merge-count*', {
      statusCode: 200,
      body: { data: [{ event_time: '2025-01-01', avg_CurrentMetric_Merge: 120, avg_CurrentMetric_PartMutation: 22 }], metadata: { duration: 32, rows: 1 } },
    }).as('chartData')
    cy.mount(<ChartMergeCount {...defaultProps} />)
    cy.wait('@chartData')
    cy.get('a[href*="/merges"]').should('exist')
    cy.get('a[href*="/mutations"]').should('exist')
  })

  it('works with different hostId values', () => {
    cy.intercept('GET', '/api/v1/charts/merge-count?hostId=1*', {
      statusCode: 200,
      body: { data: [{ event_time: '2025-01-01', avg_CurrentMetric_Merge: 100, avg_CurrentMetric_PartMutation: 15 }], metadata: { duration: 30, rows: 1 } },
    }).as('chartData')
    cy.mount(<ChartMergeCount hostId={1} />)
    cy.wait('@chartData')
    cy.get('[data-testid="merge-count-chart"]').should('exist')
  })
})
