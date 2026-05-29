import type { FilterSchema } from '@/lib/filters/types'

import { AddFilterPopover } from './add-filter-popover'

const schema: FilterSchema = {
  fields: [
    {
      key: 'duration',
      column: 'duration',
      label: 'Duration',
      type: 'number',
      unit: 'ms',
      operators: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between'],
    },
    {
      key: 'user',
      column: 'user',
      label: 'User',
      type: 'text',
      operators: ['eq', 'ne', 'contains', 'notContains', 'in', 'notIn'],
    },
    {
      key: 'type',
      column: 'type',
      label: 'Type',
      type: 'select',
      options: [],
      operators: ['eq', 'ne', 'in', 'notIn'],
    },
  ],
}

describe('AddFilterPopover', () => {
  it('renders the trigger button', () => {
    cy.mount(
      <AddFilterPopover
        schema={schema}
        activeKeys={[]}
        configName="queries"
        onAdd={cy.stub()}
      />
    )

    cy.contains('button', 'Add filter').should('exist')
  })

  it('opens the field picker and lists every schema field by label', () => {
    cy.mount(
      <AddFilterPopover
        schema={schema}
        activeKeys={[]}
        configName="queries"
        onAdd={cy.stub()}
      />
    )

    cy.contains('button', 'Add filter').click()

    cy.contains('Duration').should('be.visible')
    cy.contains('User').should('be.visible')
    cy.contains('Type').should('be.visible')
  })

  it('hides fields whose keys are already in activeKeys', () => {
    cy.mount(
      <AddFilterPopover
        schema={schema}
        activeKeys={['duration']}
        configName="queries"
        onAdd={cy.stub()}
      />
    )

    cy.contains('button', 'Add filter').click()

    cy.contains('Duration').should('not.exist')
    cy.contains('User').should('be.visible')
    cy.contains('Type').should('be.visible')
  })

  it('shows the empty-state message when all fields are active', () => {
    cy.mount(
      <AddFilterPopover
        schema={schema}
        activeKeys={['duration', 'user', 'type']}
        configName="queries"
        onAdd={cy.stub()}
      />
    )

    cy.contains('button', 'Add filter').click()

    cy.contains('All filters are active').should('be.visible')
  })

  it('advances to the editor when a field is selected', () => {
    cy.mount(
      <AddFilterPopover
        schema={schema}
        activeKeys={[]}
        configName="queries"
        onAdd={cy.stub()}
      />
    )

    cy.contains('button', 'Add filter').click()
    cy.contains('User').click()

    // The picker's input ("Filter by...") should no longer be visible.
    cy.contains('Filter by...').should('not.exist')
  })
})
