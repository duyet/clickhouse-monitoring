import { BooleanFormat } from './boolean-format'

describe('<BooleanFormat />', () => {
  it('renders with value="1"', () => {
    cy.mount(<BooleanFormat value="1" />)
    cy.get('svg').should('have.attr', 'aria-label', 'yes')
  })

  it('renders with value="yes"', () => {
    cy.mount(<BooleanFormat value="yes" />)
    cy.get('svg').should('have.attr', 'aria-label', 'yes')
  })

  it('renders with value={true}', () => {
    cy.mount(<BooleanFormat value={true} />)
    cy.get('svg').should('have.attr', 'aria-label', 'yes')
  })

  it('renders with value="y"', () => {
    cy.mount(<BooleanFormat value="y" />)
    cy.get('svg').should('have.attr', 'aria-label', 'yes')
  })

  it('renders with value="0"', () => {
    cy.mount(<BooleanFormat value="0" />)
    cy.get('svg').should('have.attr', 'aria-label', 'no')
  })

  it('renders with value="no"', () => {
    cy.mount(<BooleanFormat value="no" />)
    cy.get('svg').should('have.attr', 'aria-label', 'no')
  })

  it('renders with value={false}', () => {
    cy.mount(<BooleanFormat value={false} />)
    cy.get('svg').should('have.attr', 'aria-label', 'no')
  })

  it('renders with value="n"', () => {
    cy.mount(<BooleanFormat value="n" />)
    cy.get('svg').should('have.attr', 'aria-label', 'no')
  })

  it('renders with value="foo"', () => {
    cy.mount(<BooleanFormat value="foo" />)
    cy.get('svg').should('have.attr', 'aria-label', 'no')
  })

  it('renders with value={undefined}', () => {
    cy.mount(<BooleanFormat value={undefined} />)
    cy.get('svg').should('have.attr', 'aria-label', 'no')
  })

  // Expanding tests to cover more boolean value representations
  it('renders with value="True"', () => {
    cy.mount(<BooleanFormat value="True" />)
    cy.get('svg').should('have.attr', 'aria-label', 'yes')
  })

  it('renders with value="False"', () => {
    cy.mount(<BooleanFormat value="False" />)
    cy.get('svg').should('have.attr', 'aria-label', 'no')
  })

  it('renders with value="TRUE"', () => {
    cy.mount(<BooleanFormat value="TRUE" />)
    cy.get('svg').should('have.attr', 'aria-label', 'yes')
  })

  it('renders with value="FALSE"', () => {
    cy.mount(<BooleanFormat value="FALSE" />)
    cy.get('svg').should('have.attr', 'aria-label', 'no')
  })

  it('renders with value="t"', () => {
    cy.mount(<BooleanFormat value="t" />)
    cy.get('svg').should('have.attr', 'aria-label', 'yes')
  })

  it('renders with value="f"', () => {
    cy.mount(<BooleanFormat value="f" />)
    cy.get('svg').should('have.attr', 'aria-label', 'no')
  })

  // Verify the correct icon is displayed for each boolean value
  it('renders with value="1" and checks for correct icon', () => {
    cy.mount(<BooleanFormat value="1" />)
    cy.get('svg').should('have.class', 'text-green-700')
  })

  it('renders with value="0" and checks for correct icon', () => {
    cy.mount(<BooleanFormat value="0" />)
    cy.get('svg').should('have.class', 'text-rose-700')
  })
})
