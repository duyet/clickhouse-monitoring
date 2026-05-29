import { ChartQueryCache } from './query-cache'

describe('<ChartQueryCache />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Query Cache',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartQueryCache {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Query Cache').should('exist')
  })

  it('renders chart with data', () => {
    cy.mount(<ChartQueryCache {...defaultProps} />)

    // Component should render without throwing
    cy.contains('Query Cache').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(
      <ChartQueryCache {...defaultProps} className="custom-test-class" />
    )

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.mount(<ChartQueryCache hostId={1} title="Host 1 Query Cache" />)

    cy.contains('Host 1 Query Cache').should('exist')
  })
})
