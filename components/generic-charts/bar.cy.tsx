import { BarChart } from './bar'

describe('<BarChart />', () => {
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
  ]

  it('renders with default props', () => {
    cy.mount(<BarChart data={data} categories={['A', 'B', 'C']} index="date" />)
    cy.screenshot()

    // Render as svg
    cy.get('svg:first').as('chart').should('be.visible')

    // Contains date
    cy.get('@chart').should('contain', '2025-01-01')

    // Hover to show tooltip
    // Size: 500x500
    cy.get('@chart').trigger('mouseover')

    // Display tooltip of the 2nd data
    cy.get('div').should('contain', '2025-02-01')
  })

  it('renders with showLegend', () => {
    cy.mount(
      <BarChart
        data={data}
        categories={['A', 'B', 'C']}
        index="date"
        showLegend
      />
    )
    cy.screenshot()

    // Render as svg
    cy.get('svg:first').as('chart').should('be.visible')

    // Contains legend
    cy.get('.recharts-legend-wrapper').as('legend').should('be.visible')
    cy.get('@legend').contains('A')
    cy.get('@legend').contains('B')
    cy.get('@legend').contains('C')
  })

  it('renders with showLabel', () => {
    cy.mount(
      <BarChart
        data={data}
        categories={['A', 'B', 'C']}
        index="date"
        showLabel
      />
    )
    cy.screenshot()

    // Render as svg
    cy.get('svg:first').as('chart').should('be.visible')

    // Show label
    cy.get('@chart')
      .should('be.visible')
      .and('contain', '1000')
      .and('contain', '2000')
      .and('contain', '501')
  })

  it('renders with readableColumn', () => {
    cy.mount(
      <BarChart
        data={data}
        categories={['A', 'B', 'C']}
        index="date"
        readableColumn="readable_A"
        showLegend
        showLabel
      />
    )
    cy.screenshot()

    // Render as svg
    cy.get('svg:first').as('chart').should('be.visible')

    // Display label data from readable_A instead of A
    cy.get('@chart')
      .children()
      .should('contain', 'one')
      .and('contain', 'hundred')

    cy.get('@chart')
      .children()
      .should('contain', 'six')
      .and('contain', 'hundred')
      .and('contain', 'forty')
      .and('contain', 'one')
  })

  it('renders with showLegend={false}', () => {
    cy.mount(
      <BarChart
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
      <BarChart
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

  it('renders tickFormatter={(value) => value.slice(0, 4)}', () => {
    cy.mount(
      <BarChart
        data={data}
        categories={['A', 'B', 'C']}
        index="date"
        tickFormatter={(value) => '--' + value.slice(0, 4)}
      />
    )
    cy.screenshot()

    // Render as svg
    cy.get('svg:first').as('chart').should('be.visible')

    // Display tooltip of the 2nd data
    cy.get('.recharts-cartesian-axis-ticks').should('contain', '--2025')
  })

  it('renders with stack', () => {
    cy.mount(
      <BarChart data={data} categories={['A', 'B', 'C']} index="date" stack />
    )
    cy.screenshot()

    // Render as svg
    cy.get('svg:first').as('chart').should('be.visible')
  })

  it('renders with single column', () => {
    const single_column = data[0]

    cy.mount(
      <BarChart data={[single_column]} categories={['A']} index="date" />
    )
    cy.screenshot()

    // Render as svg
    cy.get('svg:first').as('chart').should('be.visible')
    cy.get('.recharts-bar-rectangles').should('have.length', 1)
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
      <BarChart
        data={incomplete_data}
        categories={['A', 'B']}
        index="date"
        stack
      />
    )
    cy.screenshot()

    // Render as svg
    cy.get('svg:first').as('chart').should('be.visible')

    // Should have two columns
    cy.get('.recharts-bar-rectangles').should('have.length', 2)
  })

  it('renders horizontal', () => {
    cy.mount(
      <BarChart data={data} categories={['A', 'B']} index="date" horizontal />
    )
    cy.screenshot()

    // Render as svg
    cy.get('svg:first').as('chart').should('be.visible')
  })

  it('renders horizontal single category', () => {
    cy.mount(
      <BarChart data={data} categories={['A']} index="date" horizontal />
    )
    cy.screenshot()

    // Render as svg
    cy.get('svg:first').as('chart').should('be.visible')
  })

  it('renders horizontal with stack', () => {
    cy.mount(
      <BarChart
        data={data}
        categories={['A', 'B']}
        index="date"
        horizontal
        stack
      />
    )
    cy.screenshot()

    // Render as svg
    cy.get('svg:first').as('chart').should('be.visible')
  })
})
