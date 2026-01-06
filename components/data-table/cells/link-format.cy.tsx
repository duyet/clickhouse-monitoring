import type { Row } from '@tanstack/react-table'

import { LinkFormat } from './link-format'

describe('<LinkFormat />', () => {
  it('renders a link with correct href and value', () => {
    const row = { index: 0 } as Row<any>
    const data = [{ database: 'testDB', table: 'testTable' }]
    const value = 'Test Link'
    const options = { href: '/table?database=[database]&table=[table]' }

    cy.mount(
      <LinkFormat
        row={row}
        data={data}
        value={value}
        context={{}}
        options={options}
      />
    )

    cy.get('a')
      .should('have.attr', 'href', '/table?database=testDB&table=testTable')
      .and('contain.text', 'Test Link')
  })

  it('renders plain text when no href is provided', () => {
    const row = { index: 0 } as Row<any>
    const data = [{}]
    const value = 'Plain Text'

    cy.mount(<LinkFormat row={row} data={data} context={{}} value={value} />)

    cy.get('a').should('not.exist')
    cy.contains('Plain Text').should('be.visible')
  })

  it('shows arrow icon on hover', () => {
    const row = { index: 0 } as Row<any>
    const data = [{ id: '123' }]
    const value = 'Hover Me'
    const options = { href: '/item/[id]' }

    cy.mount(
      <LinkFormat
        row={row}
        data={data}
        value={value}
        context={{}}
        options={options}
      />
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
      <LinkFormat
        row={row}
        data={data}
        value={value}
        context={{}}
        options={options}
      />
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
        context={{}}
        options={options as any}
      />
    )

    cy.get('a').should('have.attr', 'href', 'https://duyet.net/item/789')
    cy.contains('Non-string Href').should('be.visible')
  })

  describe('options.className', () => {
    it('applies custom className from options', () => {
      const row = { index: 0 } as Row<any>
      const data = [{ id: '123' }]
      const value = 'Custom Class'
      const options = {
        href: '/item/[id]',
        className: 'custom-class text-red-500',
      }

      cy.mount(
        <LinkFormat
          row={row}
          data={data}
          value={value}
          context={{}}
          options={options}
        />
      )

      cy.get('a')
        .should('have.class', 'custom-class')
        .and('have.class', 'text-red-500')
    })

    it('merges custom className with default classes', () => {
      const row = { index: 0 } as Row<any>
      const data = [{ id: '123' }]
      const value = 'Merged Classes'
      const options = {
        href: '/item/[id]',
        className: 'custom-class',
      }

      cy.mount(
        <LinkFormat
          row={row}
          data={data}
          value={value}
          context={{}}
          options={options}
        />
      )

      cy.get('a')
        .should('have.class', 'group')
        .and('have.class', 'flex')
        .and('have.class', 'custom-class')
    })

    it('applies custom className from options with override', () => {
      const row = { index: 0 } as Row<any>
      const data = [{ id: '123' }]
      const value = 'Custom Class'
      const options = {
        href: '/item/[id]',
        className: 'text-red-300 text-red-400 text-red-500',
      }

      cy.mount(
        <LinkFormat
          row={row}
          data={data}
          value={value}
          context={{}}
          options={options}
        />
      )

      cy.get('a')
        .should('not.have.class', 'text-red-300')
        .and('not.have.class', 'text-red-400')
        .and('have.class', 'text-red-500')
    })
  })

  describe('context prop', () => {
    it('uses context values to replace placeholders', () => {
      const row = { index: 0 } as Row<any>
      const data = [{ database: 'testDB' }]
      const value = 'Context Test'
      const options = { href: '/[database]/[ctx.table]' }
      const context = { 'ctx.table': 'contextTable' }

      cy.mount(
        <LinkFormat
          row={row}
          data={data}
          value={value}
          context={context}
          options={options}
        />
      )

      cy.get('a').should('have.attr', 'href', '/testDB/contextTable')
    })

    it('context values override data values', () => {
      const row = { index: 0 } as Row<any>
      const data = [{ database: 'testDB', table: 'dataTable' }]
      const value = 'Override Test'
      const options = { href: '/[database]/[ctx.table]' }
      const context = { 'ctx.table': 'contextTable' }

      cy.mount(
        <LinkFormat
          row={row}
          data={data}
          value={value}
          context={context}
          options={options}
        />
      )

      cy.get('a').should('have.attr', 'href', '/testDB/contextTable')
    })

    it('handles empty context values gracefully', () => {
      const row = { index: 0 } as Row<any>
      const data = [{ database: 'testDB' }]
      const value = 'Empty Context'
      const options = { href: '/[database]/[ctx.table]/end' }
      const context = { 'ctx.table': '' }

      cy.mount(
        <LinkFormat
          row={row}
          data={data}
          value={value}
          context={context}
          options={options}
        />
      )

      cy.get('a').should('have.attr', 'href', '/testDB//end')
    })

    it('handles missing context keys gracefully', () => {
      const row = { index: 0 } as Row<any>
      const data = [{ database: 'testDB' }]
      const value = 'Missing Context'
      const options = {
        href: '/[database]/[missing_key]/[another_missing]/end',
      }
      const context = { some_other_key: 'value' }

      cy.mount(
        <LinkFormat
          row={row}
          data={data}
          value={value}
          context={context}
          options={options}
        />
      )

      cy.get('a').should('have.attr', 'href', '/testDB///end')
    })
  })
})
