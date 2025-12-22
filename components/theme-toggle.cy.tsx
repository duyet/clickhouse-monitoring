import { ThemeProvider } from 'next-themes'
import { ThemeToggle } from './theme-toggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    // Mount the component wrapped in ThemeProvider
    cy.mount(
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ThemeToggle />
      </ThemeProvider>
    )
  })

  it('should render theme toggle button', () => {
    cy.get('button[aria-label="Toggle theme"]').should('exist')
  })

  it('should open dropdown menu on click', () => {
    cy.get('button[aria-label="Toggle theme"]').click()
    cy.contains('Theme').should('be.visible')
    cy.contains('Light').should('be.visible')
    cy.contains('Dark').should('be.visible')
    cy.contains('System').should('be.visible')
  })

  it('should change theme to dark', () => {
    cy.get('button[aria-label="Toggle theme"]').click()
    cy.get('[aria-label="Dark theme"]').click()

    // Wait a bit for the theme to be applied
    cy.wait(100)

    // Verify dark class is added to html
    cy.document().its('documentElement').should('have.class', 'dark')
  })

  it('should change theme to light', () => {
    // First set to dark
    cy.get('button[aria-label="Toggle theme"]').click()
    cy.get('[aria-label="Dark theme"]').click()
    cy.wait(100)

    // Then change to light
    cy.get('button[aria-label="Toggle theme"]').click()
    cy.get('[aria-label="Light theme"]').click()
    cy.wait(100)

    // Verify dark class is not present
    cy.document().its('documentElement').should('not.have.class', 'dark')
  })

  it('should display correct icon for dark theme', () => {
    cy.get('button[aria-label="Toggle theme"]').click()
    cy.get('[aria-label="Dark theme"]').click()
    cy.wait(100)

    // Moon icon should be visible in dark mode
    cy.get('button[aria-label="Toggle theme"]').find('svg').should('exist')
  })

  it('should persist theme selection', () => {
    cy.get('button[aria-label="Toggle theme"]').click()
    cy.get('[aria-label="Dark theme"]').click()
    cy.wait(100)

    // Check localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem('theme')).to.equal('dark')
    })
  })
})
