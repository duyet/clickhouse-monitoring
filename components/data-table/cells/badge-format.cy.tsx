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

  it('renders badges with different statuses and colors', () => {
    const statuses = ['success', 'warning', 'error', 'info']
    const colors = ['green', 'yellow', 'red', 'blue']
    statuses.forEach((status, index) => {
      cy.mount(<BadgeFormat value={status} className={`bg-${colors[index]}-100`} />)
      cy.get('span').should('have.class', `bg-${colors[index]}-100`)
    })
  })

  it('ensures badge content matches expected text', () => {
    const expectedText = 'Expected Text'
    cy.mount(<BadgeFormat value={expectedText} />)
    cy.contains(expectedText).should('exist')
  })
})
