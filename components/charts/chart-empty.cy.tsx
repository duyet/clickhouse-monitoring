import { ChartEmpty } from './chart-empty'

describe('<ChartEmpty />', () => {
  it('renders empty state with title', () => {
    cy.mount(<ChartEmpty title="Test Chart" />)

    cy.contains('No results').should('exist')
    cy.contains('Test Chart').should('exist')
  })

  it('renders with custom className', () => {
    cy.mount(<ChartEmpty title="Test Chart" className="custom-class" />)

    cy.get('.custom-class').should('exist')
  })

  it('renders empty state without title', () => {
    cy.mount(<ChartEmpty />)

    cy.contains('No results').should('exist')
  })

  it('has proper accessibility attributes', () => {
    cy.mount(<ChartEmpty title="Test Chart" />)

    cy.get('[role="status"]').should('exist')
  })
})
