import type { ActiveFilter, FilterField } from '@/lib/filters/types'

import { ColumnFilterPopover } from './column-filter-popover'

const field: FilterField = {
  key: 'query',
  column: 'query',
  label: 'Query',
  type: 'text',
  operators: ['contains', 'eq'],
  placeholder: 'Search query',
}

describe('<ColumnFilterPopover />', () => {
  it('shows a filter icon trigger and opens the popover on click', () => {
    cy.mount(
      <ColumnFilterPopover
        field={field}
        def={{ type: 'text' }}
        configName="test"
        activeFilter={null}
        onSubmit={cy.stub().as('onSubmit')}
        onClear={cy.stub().as('onClear')}
      />
    )

    cy.get('button[aria-label="Filter Query"]').should('exist').click()
    // FilterEditor renders the field label inside the popover body
    cy.get('[role="dialog"]').should('be.visible').contains('Query')
  })

  it('calls onSubmit when the user fills in a value and submits', () => {
    const onSubmit = cy.stub().as('onSubmit')

    cy.mount(
      <ColumnFilterPopover
        field={field}
        def={{ type: 'text' }}
        configName="test"
        activeFilter={null}
        onSubmit={onSubmit}
        onClear={cy.stub()}
      />
    )

    cy.get('button[aria-label="Filter Query"]').click()
    cy.get('[role="dialog"]').find('input').first().type('foo')
    cy.get('[role="dialog"]')
      .contains('button', /apply|add|save/i)
      .click()

    cy.get('@onSubmit').should('have.been.calledOnce')
  })

  it('shows an active-state dot when activeFilter is set', () => {
    const active: ActiveFilter = {
      key: 'query',
      operator: 'contains',
      values: ['foo'],
    }

    cy.mount(
      <ColumnFilterPopover
        field={field}
        def={{ type: 'text' }}
        configName="test"
        activeFilter={active}
        onSubmit={cy.stub()}
        onClear={cy.stub()}
      />
    )

    cy.get('button[aria-label="Filter Query"]')
      .should('have.class', 'text-primary')
      .find('span[aria-hidden]')
      .should('have.class', 'rounded-full')
  })

  it('does not render Clear filter when activeFilter is null', () => {
    cy.mount(
      <ColumnFilterPopover
        field={field}
        def={{ type: 'text' }}
        configName="test"
        activeFilter={null}
        onSubmit={cy.stub()}
        onClear={cy.stub()}
      />
    )
    cy.get('button[aria-label="Filter Query"]').click()
    cy.get('[role="dialog"]').should('be.visible')
    cy.get('[role="dialog"]').contains('Clear filter').should('not.exist')
  })

  it('renders Clear filter and fires onClear when activeFilter is set', () => {
    const onClear = cy.stub().as('onClear')
    const active: ActiveFilter = {
      key: 'query',
      operator: 'contains',
      values: ['foo'],
    }

    cy.mount(
      <ColumnFilterPopover
        field={field}
        def={{ type: 'text' }}
        configName="test"
        activeFilter={active}
        onSubmit={cy.stub()}
        onClear={onClear}
      />
    )
    cy.get('button[aria-label="Filter Query"]').click()
    cy.get('[role="dialog"]').contains('button', 'Clear filter').click()
    cy.get('@onClear').should('have.been.calledOnce')
  })
})
