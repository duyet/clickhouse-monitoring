import { ErrorAlert } from './error-alert'

describe('<ErrorAlert />', () => {
  it('renders with string message', () => {
    cy.mount(
      <ErrorAlert
        title="Something went wrong"
        message="Checking console for more details"
      />
    )
    cy.contains('Something went wrong').should('be.visible')
    cy.contains('Checking console for more details').should('be.visible')
  })

  it('renders with JSX message', () => {
    cy.mount(
      <ErrorAlert
        title="Something went wrong"
        message={<div className="bg-green-300 p-3">Green message</div>}
      />
    )
    cy.contains('Something went wrong').should('be.visible')
    cy.get('div').should('have.class', 'bg-green-300')
  })

  it('renders with different types of messages', () => {
    const messages = [
      'This is a string message',
      <span key="jsxMessage" className="text-blue-500">
        This is a JSX message
      </span>,
    ]

    messages.forEach((message, index) => {
      cy.mount(
        <ErrorAlert
          key={`message-${index}`}
          title="Error occurred"
          message={message}
        />
      )
      cy.contains('Error occurred').should('be.visible')
      if (typeof message === 'string') {
        cy.contains(message).should('be.visible')
      } else {
        cy.get(message.type).should('have.class', message.props.className)
      }
    })
  })

  it('ensures title and message content are correctly displayed', () => {
    cy.mount(
      <ErrorAlert title="Alert Title" message="This is the alert message" />
    )
    cy.contains('Alert Title').should('be.visible')
    cy.contains('This is the alert message').should('be.visible')
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
