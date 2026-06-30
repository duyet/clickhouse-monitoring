/**
 * Cypress component test support file.
 * Loaded automatically before every component spec.
 *
 * Sets up cy.mount() using the bundled cypress/react mount helper so specs
 * can call cy.mount(<Component />) directly without boilerplate.
 */

import { mount } from 'cypress/react'

// Augment the Cypress namespace so TypeScript knows about cy.mount()
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
    }
  }
}

Cypress.Commands.add('mount', mount)
