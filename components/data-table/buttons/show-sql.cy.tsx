import { ShowSQLButton } from './show-sql'

describe('<ShowSQLButton />', () => {
  it('renders', () => {
    cy.mount(<ShowSQLButton sql="SELECT 1" />)
    cy.contains('SELECT 1').should('not.exist')
    cy.get('button[aria-label="Show SQL"]').should('exist')
    cy.get('button[aria-label="Show SQL"]').click()
    cy.contains('SELECT 1').should('exist')
  })
})
