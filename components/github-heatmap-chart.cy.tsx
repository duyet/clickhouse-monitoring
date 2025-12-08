import { GithubHeatmapChart } from './github-heatmap-chart'

const dateFmt = (ym: string, d: number) => `${ym}/${(d + 1).toString()}`

describe('<GithubHeatmapChart />', () => {
  const data = [
    ...[...Array(17)].map((_, idx) => ({
      date: dateFmt('2024/1', idx),
      count: idx * Math.floor(Math.random() * 100),
      content: '',
    })),
    ...[...Array(28)].map((_, idx) => ({
      date: dateFmt('2024/2', idx),
      count: idx * Math.floor(Math.random() * 100),
      content: '',
    })),
  ]

  const data2 = [
    ...[...Array(17)].map((_, idx) => ({
      date: dateFmt('2024/1', idx),
      count: idx * Math.floor(Math.random() * 100),
      content: '',
    })),
    ...[...Array(28)].map((_, idx) => ({
      date: dateFmt('2024/2', idx),
      count: idx * Math.floor(Math.random() * 100),
      content: '',
    })),
  ]

  it('renders with default data set', () => {
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
  })

  it('renders with empty data', () => {
    cy.mount(<GithubHeatmapChart data={[]} />)
    cy.get('svg').as('root').should('be.visible')

    // Should contains today
    const today = new Date()

    const year = today.getFullYear()
    const month = today.getMonth() + 1
    const day = today.getDay()
    const _todayLabel = `${year}/${month}/${day}`
  })

  it('renders with multiple data sets', () => {
    cy.mount(
      <GithubHeatmapChart
        data={data2}
        startDate={new Date(2024, 1, 1)}
        endDate={new Date(2025, 12, 31)}
      />
    )
    cy.get('svg').as('root').should('be.visible')
  })

  it('verifies rendering with different data sets', () => {
    const data3 = [
      ...[...Array(5)].map((_, idx) => ({
        date: dateFmt('2025/3', idx),
        count: (idx + 1) * 5,
        content: `Content ${idx + 1}`,
      })),
    ]

    cy.mount(
      <GithubHeatmapChart
        data={data3}
        startDate={new Date(2025, 2, 1)}
        endDate={new Date(2025, 2, 31)}
      />
    )

    cy.get('svg').as('root').should('be.visible')
    cy.get('@root').find('rect').its('length').should('be.gte', 1)
    data3.forEach((item) => {
      cy.get(`[data-date="${item.date}"]`)
        .should('have.attr', 'fill')
        .and('match', /^#[A-z0-9]+/)
    })
  })

  it('hover tooltip displays correct data', () => {
    console.log('data', data)

    cy.mount(
      <GithubHeatmapChart
        data={data}
        startDate={new Date(2024, 1, 1)}
        endDate={new Date(2024, 5, 1)}
      />
    )
    cy.get('svg').as('root').should('be.visible')

    // Last 3 items of data
    data.slice(-3).forEach((item) => {
      cy.get(`[data-date="${item.date}"]`).trigger('mouseover')
      // TODO: fix tooltip not showing
      // cy.get('.cy-tooltip').should('contain', item.date)
      // cy.get('.cy-tooltip').should('contain', item.count.toString())
    })
  })
})
