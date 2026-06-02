import type { ActiveFilter, FilterField } from '@/lib/filters/types'

import { FilterChip } from './filter-chip'

const field: FilterField = {
  key: 'duration',
  column: 'duration',
  label: 'Duration',
  type: 'number',
  unit: 'ms',
  operators: ['between'],
}

const filter: ActiveFilter = {
  key: 'duration',
  operator: 'between',
  values: ['100', '500'],
}

describe('FilterChip', () => {
  it('renders the field label and operator', () => {
    cy.mount(
      <FilterChip
        field={field}
        filter={filter}
        configName="queries"
        onChange={cy.stub()}
        onRemove={cy.stub()}
      />
    )

    cy.contains('Duration').should('exist')
    cy.contains('between').should('exist')
  })

  it('renders the formatted value text with unit', () => {
    cy.mount(
      <FilterChip
        field={field}
        filter={filter}
        configName="queries"
        onChange={cy.stub()}
        onRemove={cy.stub()}
      />
    )

    cy.contains('100 – 500 ms').should('exist')
  })

  it('invokes onRemove when the X button is clicked', () => {
    const onRemove = cy.stub().as('onRemove')

    cy.mount(
      <FilterChip
        field={field}
        filter={filter}
        configName="queries"
        onChange={cy.stub()}
        onRemove={onRemove}
      />
    )

    cy.get('[aria-label="Remove Duration filter"]').click()
    cy.get('@onRemove').should('have.been.calledOnce')
  })

  it('opens the editor popover when the chip body is clicked', () => {
    cy.mount(
      <FilterChip
        field={field}
        filter={filter}
        configName="queries"
        onChange={cy.stub()}
        onRemove={cy.stub()}
      />
    )

    // Click the trigger button (the part of the chip that's not the X).
    cy.contains('Duration').click()

    // The popover content (FilterEditor) should now be in the DOM.
    cy.get('[role="dialog"]').should('exist')
  })
})
