import { DurationFormat } from './duration-format'

describe('<DurationFormat />', () => {
  it('renders 120s correctly', () => {
    cy.mount(<DurationFormat value="120" />)
    cy.get('span').should('have.attr', 'title').and('match', /120/)
    cy.get('span').should('contain', '2 minutes')
  })

  it('renders 12000s correctly', () => {
    cy.mount(<DurationFormat value="12000" />)
    cy.get('span').should('have.attr', 'title').and('match', /12000/)
    cy.get('span').should('contain', '3 hours')
  })

  it('renders 0s correctly', () => {
    cy.mount(<DurationFormat value="0" />)
    cy.get('span').should('have.attr', 'title').and('match', /0/)
    cy.get('span').should('contain', 'a few seconds')
  })

  it('renders -100s correctly', () => {
    cy.mount(<DurationFormat value="-100" />)
    cy.get('span').should('contain', '2 minutes ago')
  })

  it('handles invalid value gracefully', () => {
    cy.mount(<DurationFormat value="invalid" />)
    cy.get('span')
      .should('have.attr', 'title')
      .and('match', /invalid/)
    cy.get('span').should('contain', 'invalid')
  })

  it('renders with a title attribute', () => {
    const testValue = '300'
    cy.mount(<DurationFormat value={testValue} />)
    cy.get('span').should('have.attr', 'title', testValue)
  })
})
