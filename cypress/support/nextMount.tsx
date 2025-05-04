import { mount } from 'cypress/react'
import { HeadManagerContext } from 'next/dist/shared/lib/head-manager-context.shared-runtime'
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime'

export const nextMount = (
  children: React.ReactNode,
  options: Record<any, any>
) => {
  // Mock a `Router`, enable asserting against function calls using `cy.stub`: ( cy.get('@router:back').should(...) )
  const router = {
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    basePath: '',
    back: cy.stub().as('router:back'),
    forward: cy.stub().as('router:forward'),
    push: cy.stub().as('router:push'),
    reload: cy.stub().as('router:reload'),
    replace: cy.stub().as('router:replace'),
    isReady: true,
    ...(options?.router || {}),
  }
  // Mock a `HeadManager`, enable asserting against additions via `<Head />` & `<Script />` using `cy.stub`
  const headManager = {
    updateHead: cy.stub().as('head:updateHead'),
    mountedInstances: new Set(),
    updateScripts: cy.stub().as('head:updateScripts'),
    scripts: new Set(),
    getIsSsr: () => false,
    appDir: false,
    nonce: '_',
    ...(options?.head || {}),
  }

  return mount(
    <HeadManagerContext.Provider value={headManager}>
      <RouterContext.Provider value={router}>{children}</RouterContext.Provider>
    </HeadManagerContext.Provider>,
    options
  )
}
