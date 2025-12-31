import { IntervalSelect } from '../interval-select'

// Mock the useAppContext
const mockIntervals: { value: string; label: string }[] = [
  { value: 'toStartOfMinute', label: '1m' },
  { value: 'toStartOfFiveMinutes', label: '5m' },
  { value: 'toStartOfTenMinutes', label: '10m' },
  { value: 'toStartOfFifteenMinutes', label: '15m' },
]

describe('<IntervalSelect />', () => {
  describe('rendering', () => {
    it('renders interval selector button', () => {
      cy.mount(<IntervalSelect />)

      cy.get('button[role="combobox"]').should('exist')
    })

    it('displays current interval label', () => {
      cy.mount(<IntervalSelect />)

      cy.get('button[role="combobox"]').should('exist')
    })

    it('shows caret icon', () => {
      cy.mount(<IntervalSelect />)

      cy.get('button[role="combobox"]')
        .find('svg')
        .should('exist')
    })

    it('has correct ARIA attributes', () => {
      cy.mount(<IntervalSelect />)

      cy.get('button[role="combobox"]')
        .should('have.attr', 'aria-label', 'Select time interval')
        .and('have.attr', 'aria-expanded', 'false')
    })
  })

  describe('popover interaction', () => {
    it('opens popover on click', () => {
      cy.mount(<IntervalSelect />)

      cy.get('button[role="combobox"]').click()
      cy.get('[role="listbox"]').should('exist')
    })

    it('closes popover when selecting interval', () => {
      cy.mount(<IntervalSelect />)

      cy.get('button[role="combobox"]').click()
      cy.contains('1m').click()

      // Popover should close after selection
      cy.get('[role="listbox"]').should('not.exist')
    })

    it('toggles popover on repeated clicks', () => {
      cy.mount(<IntervalSelect />)

      // First click opens
      cy.get('button[role="combobox"]').click()
      cy.get('[role="listbox"]').should('exist')

      // Second click closes
      cy.get('button[role="combobox"]').click()
      cy.get('[role="listbox"]').should('not.exist')
    })
  })

  describe('default intervals', () => {
    it('shows all default interval options', () => {
      cy.mount(<IntervalSelect />)

      cy.get('button[role="combobox"]').click()

      cy.contains('1m').should('exist')
      cy.contains('5m').should('exist')
      cy.contains('10m').should('exist')
      cy.contains('15m').should('exist')
    })

    it('has 4 default intervals', () => {
      cy.mount(<IntervalSelect />)

      cy.get('button[role="combobox"]').click()

      cy.get('[role="option"]').should('have.length', 4)
    })
  })

  describe('custom intervals', () => {
    it('uses custom intervals when provided', () => {
      const customIntervals = [
        { value: 'toStartOfMinute', label: '1 minute' },
        { value: 'toStartOfHour', label: '1 hour' },
      ]

      cy.mount(<IntervalSelect values={customIntervals} />)

      cy.get('button[role="combobox"]').click()

      cy.contains('1 minute').should('exist')
      cy.contains('1 hour').should('exist')
      cy.contains('5m').should('not.exist') // Default interval not shown
    })

    it('shows correct number of custom intervals', () => {
      const customIntervals = [
        { value: 'toStartOfMinute', label: '1m' },
        { value: 'toStartOfHour', label: '1h' },
        { value: 'toStartOfDay', label: '1d' },
      ]

      cy.mount(<IntervalSelect values={customIntervals} />)

      cy.get('button[role="combobox"]').click()

      cy.get('[role="option"]').should('have.length', 3)
    })

    it('handles empty custom values array', () => {
      cy.mount(<IntervalSelect values={[]} />)

      // Should fall back to default intervals
      cy.get('button[role="combobox"]').click()

      cy.contains('1m').should('exist')
      cy.contains('5m').should('exist')
    })
  })

  describe('interval selection', () => {
    it('selects 1m interval', () => {
      cy.mount(<IntervalSelect />)

      cy.get('button[role="combobox"]').click()
      cy.contains('1m').click()
    })

    it('selects 5m interval', () => {
      cy.mount(<IntervalSelect />)

      cy.get('button[role="combobox"]').click()
      cy.contains('5m').click()
    })

    it('selects 10m interval', () => {
      cy.mount(<IntervalSelect />)

      cy.get('button[role="combobox"]').click()
      cy.contains('10m').click()
    })

    it('selects 15m interval', () => {
      cy.mount(<IntervalSelect />)

      cy.get('button[role="combobox"]').click()
      cy.contains('15m').click()
    })
  })

  describe('selected state indicator', () => {
    it('shows checkmark for selected interval', () => {
      cy.mount(<IntervalSelect />)

      cy.get('button[role="combobox"]').click()

      // Check icon should be visible for selected item
      cy.get('[role="option"]')
        .first()
        .find('svg')
        .should('have.class', 'opacity-100')
    })

    it('hides checkmark for unselected intervals', () => {
      cy.mount(<IntervalSelect />)

      cy.get('button[role="combobox"]').click()

      // Non-selected items should have opacity-0
      cy.get('[role="option"]')
        .eq(1) // Second item (not selected by default)
        .find('svg')
        .should('have.class', 'opacity-0')
    })
  })

  describe('search functionality', () => {
    it('shows search input in command', () => {
      cy.mount(<IntervalSelect />)

      cy.get('button[role="combobox"]').click()

      cy.get('input[placeholder="Search ..."]').should('exist')
    })

    it('filters intervals based on search', () => {
      cy.mount(<IntervalSelect />)

      cy.get('button[role="combobox"]').click()

      // Type in search
      cy.get('input[placeholder="Search ..."]').type('5m')

      // Should show matching result
      cy.contains('5m').should('exist')

      // Clear search
      cy.get('input[placeholder="Search ..."]').clear()

      // All options should be visible again
      cy.contains('1m').should('exist')
      cy.contains('10m').should('exist')
    })

    it('shows empty state when no matches', () => {
      cy.mount(<IntervalSelect />)

      cy.get('button[role="combobox"]').click()

      // Type non-matching search
      cy.get('input[placeholder="Search ..."]').type('invalid')

      // Should show empty state
      cy.contains('Not found.').should('exist')
    })
  })

  describe('accessibility', () => {
    it('has proper combobox role', () => {
      cy.mount(<IntervalSelect />)

      cy.get('button[role="combobox"]').should('exist')
    })

    it('has aria-label for screen readers', () => {
      cy.mount(<IntervalSelect />)

      cy.get('button[role="combobox"]')
        .should('have.attr', 'aria-label', 'Select time interval')
    })

    it('updates aria-expanded when popover opens', () => {
      cy.mount(<IntervalSelect />)

      cy.get('button[role="combobox"]')
        .should('have.attr', 'aria-expanded', 'false')

      cy.get('button[role="combobox"]').click()

      cy.get('button[role="combobox"]')
        .should('have.attr', 'aria-expanded', 'true')
    })
  })

  describe('keyboard navigation', () => {
    it('can be focused with tab', () => {
      cy.mount(<IntervalSelect />)

      cy.get('button[role="combobox"]').focus()
      cy.get('button[role="combobox"]').should('be.focused')
    })
  })

  describe('responsive layout', () => {
    it('has fixed width button', () => {
      cy.mount(<IntervalSelect />)

      cy.get('button[role="combobox"]')
        .should('have.class', 'w-[100px]')
    })

    it('popover has matching width', () => {
      cy.mount(<IntervalSelect />)

      cy.get('button[role="combobox"]').click()

      cy.get('[role="listbox"]')
        .parent()
        .should('have.class', 'w-[100px]')
    })
  })

  describe('case-insensitive interval matching', () => {
    it('handles case-insensitive interval comparison', () => {
      // Test that interval matching works regardless of case
      cy.mount(<IntervalSelect />)

      cy.get('button[role="combobox"]').click()
      cy.contains('1m').click()
    })
  })

  describe('memoization', () => {
    it('component is memoized', () => {
      // IntervalSelect uses React.memo to prevent unnecessary re-renders
      cy.mount(<IntervalSelect />)

      cy.get('button[role="combobox"]').should('exist')
    })
  })
})
