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

  describe('test `query` prop', () => {
    it('renders with debug query', () => {
      cy.mount(
        <ErrorAlert
          title="Something went wrong"
          message={'Checking query below'}
          query="SELECT 1"
        />
      )

      cy.get('button[role="open-query"]').should('be.visible')
      cy.get('button[role="open-query"]').click()
      cy.contains('SELECT 1').should('be.visible')
    })

    it('renders with debug query and JSX message', () => {
      cy.mount(
        <ErrorAlert
          title="Something went wrong"
          message={<div className="bg-green-300 p-3">Green message</div>}
          query="SELECT 1"
        />
      )
      cy.contains('Something went wrong').should('be.visible')
      cy.get('div').should('have.class', 'bg-green-300')

      cy.get('button[role="open-query"]').should('be.visible')
      cy.get('button[role="open-query"]').click()
      cy.contains('SELECT 1').should('be.visible')
    })
  })

  describe('test `docs` prop', () => {
    it('renders with docs string', () => {
      cy.mount(
        <ErrorAlert
          title="Something went wrong"
          message="Error message"
          docs="Check the documentation here"
        />
      )
      cy.get('svg').should('be.visible') // NotebookPenIcon
      cy.contains('Check the documentation here').should('be.visible')
    })

    it('renders with docs as JSX', () => {
      cy.mount(
        <ErrorAlert
          title="Something went wrong"
          message="Error message"
          docs={
            <a href="#" className="text-blue-500">
              Documentation link
            </a>
          }
        />
      )
      cy.get('svg').should('be.visible') // NotebookPenIcon
      cy.get('a')
        .should('have.class', 'text-blue-500')
        .and('contain', 'Documentation link')
    })

    it('renders with all props combined', () => {
      cy.mount(
        <ErrorAlert
          title="Error Title"
          message="Error message"
          query="SELECT * FROM users"
          docs={<span className="docs-link">View docs</span>}
        />
      )
      cy.contains('Error Title').should('be.visible')
      cy.contains('Error message').should('be.visible')
      cy.get('button[role="open-query"]').click()
      cy.contains('SELECT * FROM users').should('be.visible')
      cy.get('svg').should('be.visible') // NotebookPenIcon
      cy.get('.docs-link').should('contain', 'View docs')
    })
  })
})
