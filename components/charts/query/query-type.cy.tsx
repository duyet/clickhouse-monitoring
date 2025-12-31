import { ChartQueryType } from './query-type'

describe('<ChartQueryType />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Query Type',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartQueryType {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Query Type').should('exist')
  })

  it('renders chart with data', () => {
    cy.mount(<ChartQueryType {...defaultProps} />)

    // Component should render without throwing
    cy.contains('Query Type').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(<ChartQueryType {...defaultProps} className="custom-test-class" />)

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.mount(<ChartQueryType hostId={1} title="Host 1 Query Type" />)

    cy.contains('Host 1 Query Type').should('exist')
  })
})
