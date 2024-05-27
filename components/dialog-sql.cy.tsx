import { DialogSQL } from './dialog-sql'

describe('<DialogSQL />', () => {
  it('not renders without sql', () => {
    cy.mount(<DialogSQL />)
    cy.get('button').should('not.exist')
  })

  it('renders with sql', () => {
    cy.mount(<DialogSQL sql="SELECT 1000" />)
    cy.get('button').should('be.visible')

    cy.get('button').click()
    cy.get('pre').should('be.visible').contains('SELECT 1000')
  })

  it('renders with custom title', () => {
    cy.mount(<DialogSQL sql="SELECT 1000" title="My Title" />)
    cy.get('button').should('be.visible')

    cy.get('button').click()
    cy.get('h2').should('be.visible').contains('My Title')
  })

  it('renders with custom description', () => {
    cy.mount(<DialogSQL sql="SELECT 1000" description="My Description" />)
    cy.get('button').should('be.visible')

    cy.get('button').click()
    cy.get('p').should('be.visible').contains('My Description')
  })

  // Verify the dialog opens and closes correctly upon button clicks
  it('dialog opens and closes correctly', () => {
    cy.mount(<DialogSQL sql="SELECT 1000" />)
    cy.get('button').click()
    cy.get('pre').should('be.visible')

    // Click outside modal
    cy.get('body').click('topRight')
    cy.get('pre').should('not.exist')
  })

  // Ensure the SQL content is displayed correctly within the dialog
  it('SQL content is displayed correctly', () => {
    const sqlContent = "SELECT * FROM table WHERE id > 1000"
    cy.mount(<DialogSQL sql={sqlContent} />)
    cy.get('button').click()
    cy.get('pre').should('contain', sqlContent)
  })
})
