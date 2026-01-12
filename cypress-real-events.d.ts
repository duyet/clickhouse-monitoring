declare module 'cypress-real-events' {
  export function realClick(
    subject: Cypress.Chainable,
    options?: Partial<Cypress.ClickOptions>
  ): Cypress.Chainable
  export function realHover(subject: Cypress.Chainable): Cypress.Chainable
  export function realMouseDown(
    subject: Cypress.Chainable,
    options?: Partial<Cypress.MouseDownOptions>
  ): Cypress.Chainable
  export function realMouseUp(
    subject: Cypress.Chainable,
    options?: Partial<Cypress.MouseUpOptions>
  ): Cypress.Chainable
  export function realMouseMove(
    subject: Cypress.Chainable,
    options?: Partial<Cypress.MouseMoveOptions>
  ): Cypress.Chainable
  export function realType(
    subject: Cypress.Chainable,
    text: string,
    options?: Partial<Cypress.TypeOptions>
  ): Cypress.Chainable
  export function realTouch(
    subject: Cypress.Chainable,
    options?: Partial<Cypress.TouchOptions>
  ): Cypress.Chainable
  export function realDrag(
    subject: Cypress.Chainable,
    to: Cypress.Selector | Cypress.JQuery | HTMLElement | number,
    options?: Partial<Cypress.DragOptions>
  ): Cypress.Chainable
}
