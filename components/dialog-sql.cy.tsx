import React from 'react'

import { DialogSQL } from './dialog-sql'

describe('<DialogSQL />', () => {
  it('not renders without sql', () => {
    cy.mount(<DialogSQL />)
    cy.get('button').should('not.exist')
  })

  it('renders with sql', () => {
    cy.mount(<DialogSQL sql="SELECT 1000" />)
    cy.get('button').should('be.visible')

    cy.get('button').click()
    cy.get('pre').should('be.visible').contains('SELECT 1000')
  })

  it('renders with custom title', () => {
    cy.mount(<DialogSQL sql="SELECT 1000" title="My Title" />)
    cy.get('button').should('be.visible')

    cy.get('button').click()
    cy.get('h2').should('be.visible').contains('My Title')
  })

  it('renders with custom description', () => {
    cy.mount(<DialogSQL sql="SELECT 1000" description="My Description" />)
    cy.get('button').should('be.visible')

    cy.get('button').click()
    cy.get('p').should('be.visible').contains('My Description')
  })
})
