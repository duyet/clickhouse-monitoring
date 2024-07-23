import { Row } from '@tanstack/react-table'
import { LinkFormat } from './link-format'

describe('<LinkFormat />', () => {
  it('renders a link with correct href and value', () => {
    const row = { index: 0 } as Row<any>
    const data = [{ database: 'testDB', table: 'testTable' }]
    const value = 'Test Link'
    const options = { href: '/tables/[database]/[table]' }

    cy.mount(
      <LinkFormat row={row} data={data} value={value} options={options} />
    )

    cy.get('a')
      .should('have.attr', 'href', '/tables/testDB/testTable')
      .and('contain.text', 'Test Link')
  })

  it('renders plain text when no href is provided', () => {
    const row = { index: 0 } as Row<any>
    const data = [{}]
    const value = 'Plain Text'

    cy.mount(<LinkFormat row={row} data={data} value={value} />)

    cy.get('a').should('not.exist')
    cy.contains('Plain Text').should('be.visible')
  })

  it('shows arrow icon on hover', () => {
    const row = { index: 0 } as Row<any>
    const data = [{ id: '123' }]
    const value = 'Hover Me'
    const options = { href: '/item/[id]' }

    cy.mount(
      <LinkFormat row={row} data={data} value={value} options={options} />
    )

    cy.get('a').as('link')
    cy.get('@link').find('svg').should('have.class', 'text-transparent')
    cy.get('@link').realHover()
    cy.get('@link').find('svg').should('be.visible')
  })

  it('handles multiple placeholders in href', () => {
    const row = { index: 0 } as Row<any>
    const data = [{ type: 'user', id: '456', action: 'edit' }]
    const value = 'Complex Link'
    const options = { href: '/[type]/[id]/[action]' }

    cy.mount(
      <LinkFormat row={row} data={data} value={value} options={options} />
    )

    cy.get('a').should('have.attr', 'href', '/user/456/edit')
  })

  it('handles URL object href in options', () => {
    const row = { index: 0 } as Row<any>
    const data = [{ id: '789' }]
    const value = 'Non-string Href'
    const options = { href: new URL('/item/[id]', 'https://duyet.net') }

    cy.mount(
      <LinkFormat
        row={row}
        data={data}
        value={value}
        options={options as any}
      />
    )

    cy.get('a').should('have.attr', 'href', 'https://duyet.net/item/789')
    cy.contains('Non-string Href').should('be.visible')
  })
})
