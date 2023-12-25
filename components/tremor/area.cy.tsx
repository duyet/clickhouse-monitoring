import React from 'react'

import { AreaChart } from './area'

describe('<AreaChart />', () => {
  const data = [
    {
      date: '2025-01-01',
      A: 100,
      B: 200,
      C: 50,
      readable_A: 'one hundred',
      breakdown: [
        ['x', 100],
        ['y', 200],
      ],
    },
    {
      date: '2025-02-01',
      A: 641,
      B: 124,
      C: 821,
      readable_A: 'six hundred and forty one',
      breakdown: [
        ['x', 100],
        ['y', 200],
      ],
    },
    {
      date: '2025-03-01',
      A: 231,
      B: 12,
      C: 124,
      readable_A: 'two hundred and thirty one',
      breakdown: [
        ['x', 100],
        ['y', 200],
      ],
    },
  ]

  it('renders', () => {
    cy.mount(
      <AreaChart data={data} categories={['A', 'B', 'C']} index="date" />
    )
    cy.screenshot()

    // Render as svg
    cy.get('svg').should('be.visible')

    // Contains legend
    cy.get('.tremor-Legend-root').should('be.visible')
    cy.get('.tremor-Legend-root').contains('A')
    cy.get('.tremor-Legend-root').contains('B')
    cy.get('.tremor-Legend-root').contains('C')

    // Contains date
    cy.get('svg:first').as('chart').should('contain', '2025-01-01')

    // Hover to show tooltip
    // Size: 500x500
    cy.get('@chart').trigger('mouseover')

    // Display tooltip of the 2nd data
    cy.get('div').should('contain', '2025-02-01')
  })

  it('renders with readable', () => {
    cy.mount(
      <AreaChart
        data={data}
        categories={['A', 'B', 'C']}
        index="date"
        readable
        readableColumns={['readable_A']}
      />
    )

    // Render as svg
    cy.get('svg:first').as('chart')

    // Hover to show tooltip
    // Size: 500x500
    cy.get('@chart').trigger('mouseover')

    // Display tooltip of the 2nd data
    cy.get('div.recharts-tooltip-wrapper').as('tooltip')
    cy.get('@tooltip').should('contain', 'six hundred and forty one')
  })

  it('renders with breakdown tooltip', () => {
    cy.mount(
      <AreaChart
        data={data}
        categories={['A', 'B', 'C']}
        index="date"
        breakdown="breakdown"
      />
    )

    // Render as svg
    cy.get('svg:first').as('chart')

    // Hover to show tooltip
    // Size: 500x500
    cy.get('@chart').trigger('mouseover')

    // Display tooltip of the 2nd data
    cy.get('div.recharts-tooltip-wrapper').as('tooltip')
    cy.get('@tooltip').should('contain', '2025-02-01')
    cy.get('@tooltip').should('contain', 'A: 641')
    cy.get('@tooltip').should('contain', 'x')
    cy.get('@tooltip').should('contain', 'y')
  })
})
