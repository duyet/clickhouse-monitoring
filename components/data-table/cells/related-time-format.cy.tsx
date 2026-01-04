import { RelatedTimeFormat } from './related-time-format'

describe('<RelatedTimeFormat />', () => {
  beforeEach(() => {
    // Set timezone for consistent testing
    cy.stub(window, 'process').value({
      env: {
        NEXT_PUBLIC_CLICKHOUSE_TZ: 'UTC',
        CLICKHOUSE_TZ: 'UTC',
      },
    })
  })

  it('renders relative time for valid timestamp', () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
    const timestamp = pastDate.toISOString()

    cy.mount(<RelatedTimeFormat value={timestamp} />)

    cy.get('span').should('contain.text', 'ago')
  })

  it('displays full timestamp on hover (title attribute)', () => {
    const timestamp = '2024-01-15T10:30:00Z'

    cy.mount(<RelatedTimeFormat value={timestamp} />)

    cy.get('span').should('have.attr', 'title', timestamp)
    cy.get('span').realHover()
    // The title attribute shows on hover, but we can't test the tooltip content directly in Cypress
    // We can verify the title attribute exists
  })

  it('handles invalid timestamp gracefully', () => {
    const invalidTimestamp = 'invalid-date'

    cy.mount(<RelatedTimeFormat value={invalidTimestamp} />)

    // Should render something without crashing
    cy.get('span').should('exist')
  })

  it('handles null value gracefully', () => {
    cy.mount(<RelatedTimeFormat value={null} />)

    cy.get('span').should('exist')
  })

  it('handles undefined value gracefully', () => {
    cy.mount(<RelatedTimeFormat value={undefined} />)

    cy.get('span').should('exist')
  })

  it('handles empty string', () => {
    cy.mount(<RelatedTimeFormat value="" />)

    cy.get('span').should('exist')
  })

  it('renders "in a few seconds" for future date', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 5) // 5 minutes in future
    const timestamp = futureDate.toISOString()

    cy.mount(<RelatedTimeFormat value={timestamp} />)

    cy.get('span').should('contain.text', 'in')
  })

  it('renders "a few seconds ago" for very recent time', () => {
    const recentDate = new Date(Date.now() - 1000) // 1 second ago
    const timestamp = recentDate.toISOString()

    cy.mount(<RelatedTimeFormat value={timestamp} />)

    cy.get('span').should('contain.text', 'seconds')
  })

  it('renders "a day ago" for yesterday', () => {
    const yesterday = new Date(Date.now() - 1000 * 60 * 60 * 24)
    const timestamp = yesterday.toISOString()

    cy.mount(<RelatedTimeFormat value={timestamp} />)

    cy.get('span').should('contain.text', 'day')
  })

  it('renders various time formats correctly', () => {
    const testCases = [
      { offset: 1000 * 60, expectedUnit: 'minute' }, // 1 minute
      { offset: 1000 * 60 * 60, expectedUnit: 'hour' }, // 1 hour
      { offset: 1000 * 60 * 60 * 24, expectedUnit: 'day' }, // 1 day
      { offset: 1000 * 60 * 60 * 24 * 7, expectedUnit: 'week' }, // 1 week
      { offset: 1000 * 60 * 60 * 24 * 30, expectedUnit: 'month' }, // ~1 month
      { offset: 1000 * 60 * 60 * 24 * 365, expectedUnit: 'year' }, // ~1 year
    ]

    testCases.forEach(({ offset, expectedUnit }) => {
      const date = new Date(Date.now() - offset)
      const timestamp = date.toISOString()

      cy.mount(<RelatedTimeFormat value={timestamp} />)

      cy.get('span').should('contain.text', expectedUnit)
    })
  })

  it('has accessible span element', () => {
    const timestamp = '2024-01-15T10:30:00Z'

    cy.mount(<RelatedTimeFormat value={timestamp} />)

    cy.get('span').should('have.attr', 'title')
  })

  it('handles ISO 8601 format', () => {
    const timestamp = '2024-01-15T10:30:00.000Z'

    cy.mount(<RelatedTimeFormat value={timestamp} />)

    cy.get('span').should('contain.text', 'ago')
  })

  it('handles Unix timestamp (number)', () => {
    const unixTimestamp = Math.floor(Date.now() / 1000) // Current time in seconds

    cy.mount(<RelatedTimeFormat value={unixTimestamp} />)

    cy.get('span').should('exist')
  })
})
