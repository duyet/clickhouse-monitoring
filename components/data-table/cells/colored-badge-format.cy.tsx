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

  it('applies additional className', () => {
    cy.mount(<ColoredBadgeFormat value="Test" className="extra-class" />)
    cy.get('span').should('have.class', 'extra-class')
  })
})
