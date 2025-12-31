import { ChartReplicationQueueCount } from './replication-queue-count'

describe('<ChartReplicationQueueCount />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Replication Queue',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartReplicationQueueCount {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Replication Queue').should('exist')
  })

  it('renders chart with data', () => {
    cy.mount(<ChartReplicationQueueCount {...defaultProps} />)

    // Component should render without throwing
    cy.contains('Replication Queue').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(<ChartReplicationQueueCount {...defaultProps} className="custom-test-class" />)

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.mount(<ChartReplicationQueueCount hostId={1} title="Host 1 Replication Queue" />)

    cy.contains('Host 1 Replication Queue').should('exist')
  })
})
