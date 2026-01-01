import { BarList } from './bar-list'

describe('<BarList />', () => {
  const mockData = [
    { name: 'table_a', value: 1000000, formatted: '1 million' },
    { name: 'table_b', value: 500000, formatted: '500K' },
    { name: 'table_c', value: 100000, formatted: '100K' },
    { name: 'table_d', value: 50000, formatted: '50K' },
    { name: 'table_e', value: 1000, formatted: '1K' },
  ]

  it('renders all data items', () => {
    cy.mount(<BarList data={mockData} />)

    mockData.forEach((item) => {
      cy.contains(item.name).should('exist')
    })
  })

  it('sorts data by value in descending order', () => {
    cy.mount(<BarList data={mockData} />)

    // First item should be the largest
    cy.get('[class*="flex items-center gap-3"]')
      .first()
      .should('contain', 'table_a')
  })

  it('uses compact format for large numbers without formatedColumn', () => {
    const dataWithoutFormatted = [
      { name: 'big_table', value: 10980000 },
      { name: 'medium_table', value: 7740000 },
      { name: 'small_table', value: 1500 },
    ]

    cy.mount(<BarList data={dataWithoutFormatted} />)

    // Should show compact format
    cy.contains('11.0M').should('exist')
    cy.contains('7.7M').should('exist')
    cy.contains('1.5K').should('exist')
  })

  it('converts verbose formats like "million" to compact', () => {
    const verboseData = [
      { name: 'table_1', value: 10980000, readable: '10.98 million' },
      { name: 'table_2', value: 7740000, readable: '7.74 million' },
      { name: 'table_3', value: 4120000, readable: '4.12 million' },
    ]

    cy.mount(<BarList data={verboseData} formatedColumn="readable" />)

    // Should convert "million" to M format
    cy.contains('11.0M').should('exist')
    cy.contains('7.7M').should('exist')
    cy.contains('4.1M').should('exist')
    // Should NOT show verbose format
    cy.contains('million').should('not.exist')
  })

  it('keeps short formatted strings as-is', () => {
    const shortFormatData = [
      { name: 'table_a', value: 329000000, size: '329.13 MiB' },
      { name: 'table_b', value: 248000000, size: '248.12 MiB' },
    ]

    cy.mount(<BarList data={shortFormatData} formatedColumn="size" />)

    // Should keep the short formatted strings
    cy.contains('329.13 MiB').should('exist')
    cy.contains('248.12 MiB').should('exist')
  })

  it('shows name inside bar when bar is wide enough', () => {
    const wideBarData = [
      { name: 'largest_table', value: 1000000 },
      { name: 'tiny_table', value: 10000 },
    ]

    cy.mount(<BarList data={wideBarData} />)

    // The largest bar should have name inside (white text)
    cy.contains('largest_table')
      .should('exist')
      .and('have.css', 'color', 'rgb(255, 255, 255)')
  })

  it('applies custom className', () => {
    cy.mount(<BarList data={mockData} className="custom-test-class" />)

    cy.get('.custom-test-class').should('exist')
  })

  it('renders bars with gradient opacity', () => {
    cy.mount(<BarList data={mockData} />)

    // All bars should have background color set via color-mix
    cy.get('[class*="rounded"]').each(($bar) => {
      const bgColor = $bar.css('background-color')
      // Should have some color (not transparent/black)
      expect(bgColor).to.not.equal('rgba(0, 0, 0, 0)')
    })
  })

  it('handles empty data gracefully', () => {
    cy.mount(<BarList data={[]} />)

    // Should render empty container without errors
    cy.get('[class*="flex flex-col"]').should('exist')
  })

  it('handles single item data', () => {
    const singleItem = [{ name: 'only_table', value: 500000 }]

    cy.mount(<BarList data={singleItem} />)

    cy.contains('only_table').should('exist')
    cy.contains('500.0K').should('exist')
  })
})
