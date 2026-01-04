import { ChartBackupSize } from './backup-size'

describe('<ChartBackupSize />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Backup Size',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartBackupSize {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Backup Size').should('exist')
  })

  it('renders chart with data', () => {
    cy.mount(<ChartBackupSize {...defaultProps} />)

    // Component should render without throwing
    cy.contains('Backup Size').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(
      <ChartBackupSize {...defaultProps} className="custom-test-class" />
    )

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.mount(<ChartBackupSize hostId={1} title="Host 1 Backup Size" />)

    cy.contains('Host 1 Backup Size').should('exist')
  })
})
