import type { Row } from '@tanstack/react-table'

import { ExpandedRow } from './expanded-row'
import { Table, TableBody } from '@/components/ui/table'

interface Sample {
  id: string
  name: string
}

function makeRow(original: Sample): Row<Sample> {
  return { id: original.id, original } as unknown as Row<Sample>
}

function MountWrapper({ children }: { children: React.ReactNode }) {
  // ExpandedRow renders a <tr>; must be inside <table><tbody> for valid DOM.
  return (
    <Table>
      <TableBody>{children}</TableBody>
    </Table>
  )
}

describe('<ExpandedRow />', () => {
  it('renders the default JSON renderer when config=true', () => {
    const row = makeRow({ id: 'r1', name: 'alpha' })

    cy.mount(
      <MountWrapper>
        <ExpandedRow row={row} colSpan={3} config={true} />
      </MountWrapper>
    )

    cy.get('tr[data-expanded-row]').should('exist')
    cy.get('tr[data-expanded-row] td').should('have.attr', 'colspan', '3')
    cy.contains('id').should('be.visible')
    cy.contains('alpha').should('be.visible')
  })

  it('renders a custom renderExpanded node when supplied', () => {
    const row = makeRow({ id: 'r2', name: 'beta' })

    cy.mount(
      <MountWrapper>
        <ExpandedRow
          row={row}
          colSpan={2}
          config={{
            renderExpanded: (data) => {
              const name = String((data as { name: string }).name)
              return <div data-testid="custom">CUSTOM {name}</div>
            },
          }}
        />
      </MountWrapper>
    )

    cy.get('[data-testid="custom"]').should('have.text', 'CUSTOM beta')
  })

  it('does not propagate click to a parent handler', () => {
    const onParent = cy.stub().as('parentClick')
    const row = makeRow({ id: 'r3', name: 'gamma' })

    cy.mount(
      <div onClick={onParent}>
        <MountWrapper>
          <ExpandedRow
            row={row}
            colSpan={2}
            config={{
              renderExpanded: () => (
                <button type="button" data-testid="inner">
                  inner
                </button>
              ),
            }}
          />
        </MountWrapper>
      </div>
    )

    cy.get('[data-testid="inner"]').click()
    cy.get('@parentClick').should('not.have.been.called')
  })
})
