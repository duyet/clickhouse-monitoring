import { BadgeFormat } from './badge-format'

describe('<BadgeFormat />', () => {
  it('renders', () => {
    cy.mount(<BadgeFormat value="the content" />)
    cy.contains('the content')
  })

  it('renders with extra className', () => {
    cy.mount(<BadgeFormat value="the content" className="text-green-700" />)
    cy.get('span').should('have.class', 'text-green-700')
  })
})
