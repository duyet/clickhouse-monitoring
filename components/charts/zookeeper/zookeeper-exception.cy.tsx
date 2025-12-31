import { ChartKeeperException } from './zookeeper-exception'

describe('<ChartKeeperException />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Zookeeper Exceptions',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartKeeperException {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Zookeeper Exceptions').should('exist')
  })

  it('renders chart with data', () => {
    cy.mount(<ChartKeeperException {...defaultProps} />)

    // Component should render without throwing
    cy.contains('Zookeeper Exceptions').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(<ChartKeeperException {...defaultProps} className="custom-test-class" />)

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.mount(<ChartKeeperException hostId={1} title="Host 1 Zookeeper Exceptions" />)

    cy.contains('Host 1 Zookeeper Exceptions').should('exist')
  })
})
