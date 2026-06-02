import {
  RunningQueriesTable,
  type RunningQueryRow,
} from './running-queries-table'
import { HostProvider } from '@/lib/swr/host-context'

const rows: RunningQueryRow[] = [
  {
    query_id: 'aa724df6-e9b6-4f4d-b106-290000000000',
    query:
      'SELECT q.* FROM ( SELECT query_id, query, query_kind, user FROM system.query_log ) q',
    query_kind: 'Select',
    user: 'duyet',
    current_database: 'default',
    interface: 2,
    elapsed: 2.4,
    read_rows: 1,
    total_rows_approx: 1,
    memory_usage: 6_123_456,
    read_bytes: 0,
  },
  {
    query_id: 'eb7e68aa-1111-2222-3333-444455556666',
    query: 'INSERT INTO events SELECT * FROM staging',
    query_kind: 'Insert',
    user: 'homelab',
    current_database: 'default',
    interface: 2,
    elapsed: 0.6,
    read_rows: 0,
    memory_usage: 2_700_000,
    read_bytes: 0,
  },
]

function Mounted({ data = rows }: { data?: RunningQueryRow[] }) {
  return (
    <HostProvider>
      <RunningQueriesTable rows={data} />
    </HostProvider>
  )
}

describe('<RunningQueriesTable /> view modes', () => {
  beforeEach(() => {
    cy.intercept('**', { statusCode: 200, body: {} })
  })

  it('defaults to the table on desktop', () => {
    cy.viewport(1280, 800)
    cy.mount(<Mounted />)

    cy.get('table').should('be.visible')
    cy.get('[data-testid="running-query-card"]').should('not.exist')
  })

  it('defaults to SQL-first cards on mobile', () => {
    cy.viewport(390, 800)
    cy.mount(<Mounted />)

    cy.get('[data-testid="running-query-card"]').should('have.length', 2)
    // The SQL leads the card.
    cy.get('[data-testid="running-query-card"]')
      .first()
      .should('contain', 'SELECT q.* FROM')
    cy.get('table').should('not.exist')
  })

  it('lets a mobile user switch back to the table', () => {
    cy.viewport(390, 800)
    cy.mount(<Mounted />)

    cy.get('[role="group"][aria-label="Result view"]').should('be.visible')
    cy.contains('button', 'Table').click()

    cy.get('table').should('be.visible')
    cy.get('[data-testid="running-query-card"]').should('not.exist')
  })

  it('lets a desktop user switch to cards', () => {
    cy.viewport(1280, 800)
    cy.mount(<Mounted />)

    cy.contains('button', 'Cards').click()
    cy.get('[data-testid="running-query-card"]').should('have.length', 2)
    cy.get('table').should('not.exist')
  })
})
