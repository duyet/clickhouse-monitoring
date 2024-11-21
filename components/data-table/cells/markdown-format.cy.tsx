import { MarkdownFormat } from './markdown-format'

describe('<MarkdownFormat />', () => {
  it('renders basic markdown text', () => {
    cy.mount(<MarkdownFormat value="Hello **World**" />)
    cy.get('strong').should('contain', 'World')
  })

  it('renders empty string when value is null or undefined', () => {
    cy.mount(<MarkdownFormat value={null} />)
    cy.get('span').should('have.text', '')

    cy.mount(<MarkdownFormat value={undefined} />)
    cy.get('span').should('have.text', '')
  })

  it('applies default classes', () => {
    cy.mount(<MarkdownFormat value="Test" />)
    cy.get('span')
      .should('have.class', 'truncate')
      .and('have.class', 'text-wrap')
  })

  it('applies custom className from options', () => {
    cy.mount(
      <MarkdownFormat value="Test" options={{ className: 'text-red-500' }} />
    )
    cy.get('span')
      .should('have.class', 'text-red-500')
      .and('have.class', 'truncate')
      .and('have.class', 'text-wrap')
  })

  it('handles non-string values by converting to string', () => {
    cy.mount(<MarkdownFormat value={123} />)
    cy.get('span').should('contain', '123')

    cy.mount(<MarkdownFormat value={true} />)
    cy.get('span').should('contain', 'true')
  })
})
