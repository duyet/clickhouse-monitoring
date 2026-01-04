import { ChartSummaryUsedByMutations } from './summary-used-by-mutations'

describe('<ChartSummaryUsedByMutations />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Summary - Used by Mutations',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartSummaryUsedByMutations {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Summary - Used by Mutations').should('exist')
  })

  it('renders error state when API fails', () => {
    cy.intercept('GET', '/api/v1/charts/summary-used-by-mutations*', {
      statusCode: 500,
      body: { error: { message: 'Database connection failed' } },
    }).as('chartError')

    cy.mount(<ChartSummaryUsedByMutations {...defaultProps} />)

    cy.wait('@chartError')
    cy.contains('Error').should('exist')
  })

  it('renders empty state when no data', () => {
    cy.intercept('GET', '/api/v1/charts/summary-used-by-mutations*', {
      statusCode: 200,
      body: { data: [], metadata: {} },
    }).as('chartEmpty')

    cy.mount(<ChartSummaryUsedByMutations {...defaultProps} />)

    cy.wait('@chartEmpty')
    cy.contains('No results').should('exist')
  })

  it('renders chart with data', () => {
    cy.intercept('GET', '/api/v1/charts/summary-used-by-mutations*', {
      statusCode: 200,
      body: {
        data: [{ running_count: 5 }],
        metadata: {
          duration: 45,
          rows: 1,
          sql: 'SELECT count() FROM system.mutations',
        },
      },
    }).as('chartData')

    cy.mount(<ChartSummaryUsedByMutations {...defaultProps} />)

    cy.wait('@chartData')
    cy.contains('running mutations').should('exist')
    cy.contains('5').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(
      <ChartSummaryUsedByMutations
        {...defaultProps}
        className="custom-test-class"
      />
    )

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.intercept('GET', '/api/v1/charts/summary-used-by-mutations?hostId=1*', {
      statusCode: 200,
      body: {
        data: [{ running_count: 3 }],
        metadata: { duration: 30, rows: 1 },
      },
    }).as('chartDataHost1')

    cy.mount(
      <ChartSummaryUsedByMutations hostId={1} title="Host 1 Mutations" />
    )

    cy.wait('@chartDataHost1')
    cy.contains('Host 1 Mutations').should('exist')
  })
})
