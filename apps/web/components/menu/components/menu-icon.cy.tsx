import { MenuIcon } from './menu-icon'

// Mock LucideIcon component
const MockIcon = ({ className }: { className?: string }) => (
  <svg className={className} data-testid="mock-icon" />
)

describe('<MenuIcon />', () => {
  it('renders icon when provided', () => {
    cy.mount(<MenuIcon icon={MockIcon as any} />)
    cy.get('[data-testid="mock-icon"]').should('exist')
  })

  it('returns null when no icon provided', () => {
    cy.mount(<MenuIcon />)
    cy.get('[data-testid="mock-icon"]').should('not.exist')
  })

  it('applies active state styling', () => {
    cy.mount(<MenuIcon icon={MockIcon as any} isActive={true} />)
    cy.get('[data-testid="mock-icon"]').should('have.class', 'text-primary')
  })

  it('applies inactive opacity when not active', () => {
    cy.mount(<MenuIcon icon={MockIcon as any} isActive={false} />)
    cy.get('[data-testid="mock-icon"]').should('have.class', 'opacity-60')
  })
})
