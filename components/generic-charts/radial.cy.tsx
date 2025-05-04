import { RadialChart } from './radial'

describe('<RadialChart />', () => {
  const data = [
    { browser: 'chrome', visitors: 275, fill: 'var(--color-chrome)' },
    { browser: 'safari', visitors: 200, fill: 'var(--color-safari)' },
    { browser: 'firefox', visitors: 187, fill: 'var(--color-firefox)' },
    { browser: 'edge', visitors: 173, fill: 'var(--color-edge)' },
    { browser: 'other', visitors: 90, fill: 'var(--color-other)' },
  ]

  it('renders with default props', () => {
    cy.mount(<RadialChart data={data} nameKey="browser" dataKey="visitors" />)
    cy.screenshot()

    // Render as svg
    cy.get('svg:first').as('chart').should('be.visible')

    // Have bar sectors (circle)
    cy.get('.recharts-radial-bar-sector').should('be.visible')
  })

  it('renders with single data point', () => {
    cy.mount(
      <RadialChart data={[data[0]]} nameKey="browser" dataKey="visitors" />
    )
    cy.screenshot()

    // Render as svg
    cy.get('svg:first').as('chart').should('be.visible')

    // Have bar sectors (circle)
    cy.get('.recharts-radial-bar-sector').as('bar').should('be.visible')

    // Hover over the first sector
    cy.get('@bar').trigger('mouseover')
    // cy.contains(data[0].browser)
  })

  it('renders and hover to show tooltip', () => {
    cy.mount(<RadialChart data={data} nameKey="browser" dataKey="visitors" />)
    cy.screenshot()

    // Render as svg
    cy.get('svg:first').as('chart').should('be.visible')

    // Hover to show tooltip
    cy.get('.recharts-radial-bar-sector')
      .last()
      .trigger('mouseover', { force: true })
    cy.contains(data[data.length - 1].browser)
  })

  it('renders with showLegend', () => {
    cy.mount(
      <RadialChart
        data={data}
        nameKey="browser"
        dataKey="visitors"
        showLegend
      />
    )
    cy.screenshot()

    // Render as svg
    cy.get('svg:first').as('chart').should('be.visible')
    cy.get('.recharts-legend-wrapper').should('be.visible')
  })

  it('renders with onClick', () => {
    const onClick = cy.stub().as('onClick')

    cy.mount(
      <RadialChart
        data={data}
        nameKey="browser"
        dataKey="visitors"
        onClick={onClick}
      />
    )

    // Click on a sector
    cy.get('.recharts-radial-bar-sector').first().click({ force: true })

    // Check if onClick was called
    cy.get('@onClick').should('have.been.calledOnce')
  })
})
