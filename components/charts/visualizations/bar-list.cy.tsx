import { BarList } from './bar-list'

describe('<BarList />', () => {
  const data = [
    {
      name: 'A',
      value: 100,
      readable_value: 'this is 100',
    },
    {
      name: 'B',
      value: 200,
      readable_value: 'this is 200',
    },
    {
      name: 'C',
      value: 50,
      readable_value: 'this is 50',
    },
  ]

  it('renders', () => {
    cy.mount(<BarList data={data} />)

    // Contains 3 bars
    cy.get('.tremor-BarList-bar').should('have.length', 3)

    // Contains: A, B, C
    cy.should('contain', 'A')
    cy.should('contain', 'B')
    cy.should('contain', 'C')

    // Contains: 100, 200, 50
    cy.get('div').should('contain', '100')
    cy.get('div').should('contain', '200')
    cy.get('div').should('contain', '50')

    // Should not contains: this is 100, this is 200, this is 50
    cy.get('div').should('not.contain', 'this is 100')
    cy.get('div').should('not.contain', 'this is 200')
    cy.get('div').should('not.contain', 'this is 50')
  })

  it('renders with formatedColumn', () => {
    cy.mount(<BarList data={data} formatedColumn="readable_value" />)

    // Contains 3 bars
    cy.get('.tremor-BarList-bar').should('have.length', 3)

    // Contains: this is 100, this is 200, this is 50
    cy.get('div').should('contain', 'this is 100')
    cy.get('div').should('contain', 'this is 200')
    cy.get('div').should('contain', 'this is 50')
  })
})
