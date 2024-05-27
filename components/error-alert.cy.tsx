import { ErrorAlert } from './error-alert'

describe('<ErrorAlert />', () => {
  it('renders', () => {
    cy.mount(
      <ErrorAlert
        title="Something went wrong"
        message="Checking console for more details"
      />
    )
    cy.contains('Something went wrong').should('be.visible')
    cy.contains('Checking console for more details').should('be.visible')
  })

  it('renders with message as <div />', () => {
    cy.mount(
      <ErrorAlert
        title="Something went wrong"
        message={<div className="bg-green-300 p-3">Green message</div>}
      />
    )
    cy.contains('Something went wrong').should('be.visible')
    cy.get('div').should('have.class', 'bg-green-300')
  })

  it('renders with debug query', () => {
    cy.mount(
      <ErrorAlert
        title="Something went wrong"
        message={'Checking query below'}
        query="SELECT 1"
      />
    )
    cy.contains('SELECT 1').should('be.visible')
  })
})
