import { AreaChart } from './area'

describe('<AreaChart />', () => {
  const data = [
    {
      date: '2025-01-01',
      A: 1000,
      B: 2000,
      C: 501,
      readable_A: 'one hundred',
    },
    {
      date: '2025-02-01',
      A: 6411,
      B: 1241,
      C: 8210,
      readable_A: 'six hundred and forty one',
    },
    {
      date: '2025-03-01',
      A: 2314,
      B: 121,
      C: 1249,
      readable_A: 'two hundred and thirty one',
    },
    {
      date: '2025-04-01',
      A: 5314,
      B: 221,
      C: 219,
      readable_A: 'two hundred and thirty one',
    },
  ]

  it('renders 1 series', () => {
    cy.mount(<AreaChart data={data} categories={['A']} index="date" />)
    cy.screenshot()

    // Render as svg
    cy.get('svg:first').as('chart').should('be.visible')

    // Contains legend
    cy.get('.recharts-legend-wrapper').as('legend').should('be.visible')
    cy.get('@legend').contains('A')

    // Hover to show tooltip
    // Size: 500x500
    cy.get('@chart').trigger('mouseover')

    // Display tooltip of the 2nd data
    cy.get('div').should('contain', '2025-02-01')

    // Display one area
    cy.get('.recharts-area').should('have.length', 1)
  })

  it('renders 2 series (no stack)', () => {
    cy.mount(<AreaChart data={data} categories={['A', 'B']} index="date" />)
    cy.screenshot()

    // Render as svg
    cy.get('svg:first').as('chart').should('be.visible')

    // Contains legend
    cy.get('.recharts-legend-wrapper').as('legend').should('be.visible')
    cy.get('@legend').contains('A')
    cy.get('@legend').contains('B')

    // Hover to show tooltip
    // Size: 500x500
    cy.get('@chart').trigger('mouseover')

    // Display tooltip of the 2nd data
    cy.get('div').should('contain', '2025-02-01')

    // Display two areas
    cy.get('.recharts-area').should('have.length', 2)
  })

  it('renders with readableColumn', () => {
    cy.mount(
      <AreaChart
        data={data}
        categories={['A', 'B', 'C']}
        index="date"
        readableColumn="readable_A"
        stack
      />
    )
    cy.screenshot()

    // Render as svg
    cy.get('svg:first').as('chart').should('be.visible')

    // Display data from readable_A instead of A
    // cy.get('@chart')
    //   .children()
    //   .should('contain', 'one')
    //   .and('contain', 'hundred')

    // cy.get('@chart')
    //   .children()
    //   .should('contain', 'six')
    //   .and('contain', 'hundred')
    //   .and('contain', 'forty')
    //   .and('contain', 'one')
  })

  it('renders with showLegend={false}', () => {
    cy.mount(
      <AreaChart
        data={data}
        categories={['A', 'B', 'C']}
        index="date"
        showLegend={false}
      />
    )
    cy.screenshot()

    // Render as svg
    cy.get('svg:first').as('chart').should('be.visible')

    // No legend
    cy.get('.recharts-legend-wrapper').should('not.exist')
  })

  it('renders with showLabel={false}', () => {
    cy.mount(
      <AreaChart
        data={data}
        categories={['A', 'B', 'C']}
        index="date"
        showLabel={false}
      />
    )
    cy.screenshot()

    // Render as svg
    cy.get('svg:first').as('chart').should('be.visible')

    // No label
    cy.get('.recharts-label-list').should('not.exist')
  })

  it('renders with tickFormatter', () => {
    cy.mount(
      <AreaChart
        data={data}
        categories={['A']}
        index="date"
        tickFormatter={(value) => '--' + value.slice(0, 4)}
      />
    )
    cy.screenshot()

    // Render as svg
    cy.get('svg:first').as('chart').should('be.visible')

    // Should have 4 ticks
    cy.get('.recharts-cartesian-axis-tick').should('have.length', data.length)

    // Display tooltip of the 2nd data
    cy.get('.recharts-cartesian-axis-ticks').should('contain', '--2025')
  })

  it('renders with stack', () => {
    cy.mount(
      <AreaChart data={data} categories={['A', 'B']} index="date" stack />
    )
    cy.screenshot()

    // Render as svg
    cy.get('svg:first').as('chart').should('be.visible')
    cy.get('.recharts-area').should('have.length', 2)
  })

  it('renders with single data point', () => {
    const single_column = data[0]

    cy.mount(
      <AreaChart data={[single_column]} categories={['A']} index="date" />
    )
    cy.screenshot()

    // Render as svg
    cy.get('svg:first').as('chart').should('be.visible')

    // Single circle data point
    cy.get('.recharts-area-dots circle').should('have.length', 1)
  })

  it('renders with incomplete data', () => {
    const incomplete_data = [
      {
        date: '2025-01-01',
        A: 1000,
        // Missing B
      },
      {
        date: '2025-02-01',
        A: 6411,
        B: 1241,
      },
    ]

    cy.mount(
      <AreaChart
        data={incomplete_data}
        categories={['A', 'B']}
        index="date"
        stack
      />
    )
    cy.screenshot()

    // Render as svg
    cy.get('svg:first').as('chart').should('be.visible')

    // Should have two layer
    cy.get('.recharts-area').should('have.length', 2)
  })
})
