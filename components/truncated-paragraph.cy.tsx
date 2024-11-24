import { TruncatedParagraph } from './truncated-paragraph'

describe('TruncatedParagraph', () => {
  const longText = 'Lorem ipsum '.repeat(500) // Create long text to ensure truncation

  it('renders with default props', () => {
    cy.mount(<TruncatedParagraph>{longText}</TruncatedParagraph>)
    cy.get('p').should('exist')

    cy.get('button').should('exist').and('contain', 'Show more')
  })

  it('expands and collapses text when clicking show more/less', () => {
    cy.mount(<TruncatedParagraph lineClamp={1}>{longText}</TruncatedParagraph>)

    // Click show more
    cy.get('button').click()

    // Verify expanded state
    cy.get('button').should('contain', 'Show less')

    // Click show less
    cy.get('button').click()

    // Verify collapsed state
    cy.get('button').should('contain', 'Show more')
  })

  it('respects custom lineClamp prop', () => {
    cy.mount(<TruncatedParagraph lineClamp={2}>{longText}</TruncatedParagraph>)
    cy.get('p').should('have.class', 'line-clamp-2')
  })

  it('applies custom className', () => {
    const customClass = 'test-custom-class'
    cy.mount(
      <TruncatedParagraph className={customClass}>
        {longText}
      </TruncatedParagraph>
    )
    cy.get('p').should('have.class', customClass)
  })

  it('handles short text without show more button', () => {
    const shortText = 'Short text that should not be truncated'
    cy.mount(<TruncatedParagraph>{shortText}</TruncatedParagraph>)
    cy.get('button').should('not.exist')
  })
})
