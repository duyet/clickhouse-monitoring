import { ChartConnectionsInterserver } from './connections-interserver'

describe('<ChartConnectionsInterserver />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Interserver Connections',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartConnectionsInterserver {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Interserver Connections').should('exist')
  })

  it('renders chart with data', () => {
    cy.mount(<ChartConnectionsInterserver {...defaultProps} />)

    // Component should render without throwing
    cy.contains('Interserver Connections').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(<ChartConnectionsInterserver {...defaultProps} className="custom-test-class" />)

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.mount(<ChartConnectionsInterserver hostId={1} title="Host 1 Interserver" />)

    cy.contains('Host 1 Interserver').should('exist')
  })
})
