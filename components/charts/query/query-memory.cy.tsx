import { ChartQueryMemory } from './query-memory'

describe('<ChartQueryMemory />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Query Memory',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartQueryMemory {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Query Memory').should('exist')
  })

  it('renders chart with data', () => {
    cy.mount(<ChartQueryMemory {...defaultProps} />)

    // Component should render without throwing
    cy.contains('Query Memory').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(
      <ChartQueryMemory {...defaultProps} className="custom-test-class" />
    )

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.mount(<ChartQueryMemory hostId={1} title="Host 1 Query Memory" />)

    cy.contains('Host 1 Query Memory').should('exist')
  })
})
