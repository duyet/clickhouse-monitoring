import { ColoredBadgeFormat } from './colored-badge-format'

describe('<ColoredBadgeFormat />', () => {
  it('renders correctly with a value', () => {
    cy.mount(<ColoredBadgeFormat value="Test" />)
    cy.get('span').should('contain', 'Test')
  })

  it('applies the correct color based on value', () => {
    cy.mount(<ColoredBadgeFormat value="Test" />)

    // Have bg-* class
    cy.get('span').should('have.css', 'background-color')
    // Have text-* class
    cy.get('span').should('have.css', 'color')
  })

  it('does not render when value is empty', () => {
    cy.mount(<ColoredBadgeFormat value="" />)
    cy.get('span').should('not.exist')
  })

  it('does not render when value is null', () => {
    cy.mount(<ColoredBadgeFormat value={null} />)
    cy.get('span').should('not.exist')
  })

  describe('options.className', () => {
    it('applies custom className from options', () => {
      cy.mount(
        <ColoredBadgeFormat
          value="Test"
          options={{ className: 'extra-class' }}
        />
      )
      cy.get('span').should('have.class', 'extra-class')
    })

    it('applies className from options with override', () => {
      cy.mount(
        <ColoredBadgeFormat
          value="Test"
          options={{ className: 'w-5 w-10 w-15' }}
        />
      )
      cy.get('span')
        .should('not.have.class', 'w-5')
        .and('not.have.class', 'w-10')
        .and('have.class', 'w-15')
    })
  })
})
