import { DialogContent } from './dialog-content'

describe('<DialogContent />', () => {
  it('not renders with empty content', () => {
    cy.mount(<DialogContent content="" />)
    cy.get('button').should('is.exist')
  })

  it('renders with string content', () => {
    cy.mount(<DialogContent content="SELECT 1000" />)
    cy.get('button').should('be.visible')
    cy.get('[role="dialog-content"]').should('not.exist')

    cy.get('button').click()
    cy.get('[role="dialog-content"]')
      .should('be.visible')
      .contains('SELECT 1000')
  })

  it('renders with ReactNode content', () => {
    cy.mount(
      <DialogContent content={<div className="custom">SELECT 1000</div>} />
    )
    cy.get('button').should('be.visible')
    cy.get('.custom').should('not.exist')

    cy.get('button').click()
    cy.get('.custom').should('be.visible').contains('SELECT 1000')
  })

  it('renders with custom title', () => {
    cy.mount(<DialogContent content="SELECT 1000" title="My Title" />)
    cy.get('button').should('be.visible')
    cy.get('h2').should('not.exist')

    cy.get('button').click()
    cy.get('h2').should('be.visible').contains('My Title')
  })

  it('renders with custom description', () => {
    cy.mount(
      <DialogContent content="SELECT 1000" description="My Description" />
    )
    cy.get('button').should('be.visible')

    cy.get('button').click()
    cy.get('p').should('be.visible').contains('My Description')
  })

  // Verify the dialog opens and closes correctly upon button clicks
  it('dialog opens and closes correctly', () => {
    cy.mount(<DialogContent content="SELECT 1000" />)
    cy.get('button').click()
    cy.get('[role="dialog-content"]').should('be.visible')

    // Click outside modal
    cy.get('[role="dialog"] button').click()
    cy.get('[role="dialog-content"]').should('not.exist')
  })

  // Ensure the SQL content is displayed correctly within the dialog
  it('SQL content is displayed correctly', () => {
    const sqlContent = 'SELECT * FROM table WHERE id > 1000'
    cy.mount(<DialogContent content={sqlContent} />)
    cy.get('button').click()
    cy.get('[role="dialog-content"]').should('contain', sqlContent)
  })
})
