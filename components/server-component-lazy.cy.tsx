import { ServerComponentLazy } from './server-component-lazy'

describe('<ServerComponentLazy />', () => {
  it('renders <div />', () => {
    cy.mount(
      <ServerComponentLazy>
        <div />
      </ServerComponentLazy>
    )
  })

  it('renders <div /> with string onError', () => {
    cy.mount(
      <ServerComponentLazy onError="error">
        <div />
      </ServerComponentLazy>
    )
  })

  it('renders <div /> with ReactNode onError', () => {
    cy.mount(
      <ServerComponentLazy onError={() => <div>error</div>}>
        <div />
      </ServerComponentLazy>
    )
  })

  it('renders <div /> with undefined onError', () => {
    cy.mount(
      <ServerComponentLazy onError={undefined}>
        <div />
      </ServerComponentLazy>
    )
  })

  it('renders <div /> with fallback', () => {
    cy.mount(
      <ServerComponentLazy fallback={<div>loading ...</div>}>
        <div />
      </ServerComponentLazy>
    )
  })
})
