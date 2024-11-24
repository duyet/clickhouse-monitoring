import { TruncatedList } from './truncated-list'

describe('TruncatedList', () => {
  const items = [
    <div key="1">Item 1</div>,
    <div key="2">Item 2</div>,
    <div key="3">Item 3</div>,
    <div key="4">Item 4</div>,
    <div key="5">Item 5</div>,
  ]

  it('renders first n items', () => {
    cy.mount(<TruncatedList items={3}>{items}</TruncatedList>)

    cy.contains('Item 1').should('be.visible')
    cy.contains('Item 2').should('be.visible')
    cy.contains('Item 3').should('be.visible')
    cy.contains('Item 4').should('not.exist')
    cy.contains('Item 5').should('not.exist')
  })

  it('shows "Show more" button when items exceed limit', () => {
    cy.mount(<TruncatedList>{items}</TruncatedList>)

    cy.contains('Show more').should('be.visible')
  })

  it('expands to show all items when "Show more" is clicked', () => {
    cy.mount(<TruncatedList>{items}</TruncatedList>)

    cy.contains('Show more').click()

    cy.contains('Item 4').should('be.visible')
    cy.contains('Item 5').should('be.visible')
    cy.contains('Show less').should('be.visible')
  })

  it('collapses back when "Show less" is clicked', () => {
    cy.mount(<TruncatedList>{items}</TruncatedList>)

    cy.contains('Show more').click()
    cy.contains('Show less').click()

    cy.contains('Item 4').should('not.exist')
    cy.contains('Item 5').should('not.exist')
    cy.contains('Show more').should('be.visible')
  })

  it('respects custom items prop', () => {
    cy.mount(<TruncatedList items={2}>{items}</TruncatedList>)

    cy.contains('Item 1').should('be.visible')
    cy.contains('Item 2').should('be.visible')
    cy.contains('Item 3').should('not.exist')
  })

  it('applies custom className', () => {
    cy.mount(<TruncatedList className="test-class">{items}</TruncatedList>)

    cy.get('.test-class').should('exist')
  })
})
