import { TextFormat } from './text-format'

describe('<TextFormat />', () => {
  it('renders basic text value', () => {
    cy.mount(<TextFormat value="Hello World" />)
    cy.contains('Hello World').should('be.visible')
  })

  it('applies default classes', () => {
    cy.mount(<TextFormat value="Test" />)
    cy.get('span').should('have.class', 'truncate')
    cy.get('span').should('have.class', 'text-wrap')
  })

  it('applies custom className from options', () => {
    cy.mount(
      <TextFormat
        value="Custom Class"
        options={{ className: 'text-red-500' }}
      />
    )
    cy.get('span')
      .should('have.class', 'text-red-500')
      .and('have.class', 'truncate')
      .and('have.class', 'text-wrap')
  })

  it('handles non-string values', () => {
    cy.mount(<TextFormat value={123} />)
    cy.contains('123').should('be.visible')

    cy.mount(<TextFormat value={true} />)
    cy.contains('true').should('be.visible')
  })

  it('handles empty or null values', () => {
    cy.mount(<TextFormat value={null} />)
    cy.get('span').should('be.empty')

    cy.mount(<TextFormat value={undefined} />)
    cy.get('span').should('be.empty')

    cy.mount(<TextFormat value="" />)
    cy.get('span').should('be.empty')
  })
})
