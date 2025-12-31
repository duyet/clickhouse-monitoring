import { ChartReadonlyReplica } from './readonly-replica'

describe('<ChartReadonlyReplica />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Readonly Replicated Tables',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartReadonlyReplica {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Readonly Replicated Tables').should('exist')
  })

  it('renders chart with data', () => {
    cy.mount(<ChartReadonlyReplica {...defaultProps} />)

    // Component should render without throwing
    cy.contains('Readonly Replicated Tables').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(<ChartReadonlyReplica {...defaultProps} className="custom-test-class" />)

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.mount(<ChartReadonlyReplica hostId={1} title="Host 1 Readonly" />)

    cy.contains('Host 1 Readonly').should('exist')
  })
})
