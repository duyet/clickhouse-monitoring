import React from 'react'

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
})
