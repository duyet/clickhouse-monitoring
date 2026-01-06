import { ChartDiskSize } from './disk-size'

describe('<ChartDiskSize />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Disk Size',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartDiskSize {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Disk Size').should('exist')
  })

  it('renders chart with data', () => {
    cy.mount(<ChartDiskSize {...defaultProps} />)

    // Component should render without throwing
    cy.contains('Disk Size').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(<ChartDiskSize {...defaultProps} className="custom-test-class" />)

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.mount(<ChartDiskSize hostId={1} title="Host 1 Disk Size" />)

    cy.contains('Host 1 Disk Size').should('exist')
  })
})
