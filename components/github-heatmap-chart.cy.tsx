import { GithubHeatmapChart } from './github-heatmap-chart'

describe('<GithubHeatmapChart />', () => {
  const data = [
    ...[...Array(17)].map((_, idx) => ({
      date: `2024/01/${idx}`,
      count: idx * Math.floor(Math.random() * 100),
      content: '',
    })),
    ...[...Array(28)].map((_, idx) => ({
      date: `2024/02/${idx}`,
      count: idx * Math.floor(Math.random() * 100),
      content: '',
    })),
  ]

  const data2 = [
    ...[...Array(17)].map((_, idx) => ({
      date: `2024/01/${idx}`,
      count: idx * Math.floor(Math.random() * 100),
      content: '',
    })),
    ...[...Array(28)].map((_, idx) => ({
      date: `2025/02/${idx}`,
      count: idx * Math.floor(Math.random() * 100),
      content: '',
    })),
  ]

  it('renders', () => {
    cy.mount(
      <GithubHeatmapChart data={data} startDate={new Date(2024, 1, 1)} />
    )

    cy.get('svg').as('root').should('be.visible')

    // Should have the month labels
    cy.get('@root')
      .contains(/Jan|Feb|Mar/)
      .should('be.visible')

    // Should have the day labels
    cy.get('@root')
      .contains(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/)
      .should('be.visible')

    // 2024/01/01 should be filled with color
    // cy.get('[data-date="2024/1/1"]')
    //   .should('exist')
    //   .should('have.attr', 'fill')
    //   .and('match', /^#[A-z0-9]+/)
  })

  it('renders with empty data', () => {
    cy.mount(<GithubHeatmapChart data={[]} />)
    cy.get('svg').as('root').should('be.visible')

    // Should contains today
    const today = new Date()

    const year = today.getFullYear()
    const month = today.getMonth() + 1
    const day = today.getDay()
    const todayLabel = `${year}/${month}/${day}`
    // cy.get(`[data-date="${todayLabel}"`).should('exist')
  })

  it('hover tooltip', () => {
    cy.mount(<GithubHeatmapChart data={data} />)
    cy.get('svg').as('root').should('be.visible')

    // cy.get('[data-date="2024/1/1"]').trigger('mouseover')
  })

  it('render 2 years', () => {
    cy.mount(
      <GithubHeatmapChart
        data={data2}
        startDate={new Date(2024, 1, 1)}
        endDate={new Date(2025, 12, 31)}
      />
    )
    cy.get('svg').as('root').should('be.visible')
  })
})
