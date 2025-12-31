import { MetricCard, MetricIcons } from './index'

describe('<MetricCard />', () => {
  // Mock SWR response
  const mockSwr = {
    data: [{ value: 42 }],
    isLoading: false,
    error: null,
  }

  describe('loading state', () => {
    it('renders skeleton when isLoading is true', () => {
      const loadingSwr = {
        data: undefined,
        isLoading: true,
        error: null,
      }

      cy.mount(
        <MetricCard
          swr={loadingSwr}
          title="Test Metric"
          icon={<div data-testid="test-icon">Icon</div>}
        />
      )

      cy.get('[aria-label="Loading Test Metric"]').should('exist')
      cy.contains('Test Metric').should('exist')
    })

    it('renders skeleton with dual variant', () => {
      const loadingSwr = {
        data: undefined,
        isLoading: true,
        error: null,
      }

      cy.mount(
        <MetricCard
          swr={loadingSwr}
          title="Test Metric"
          variant="dual"
        />
      )

      cy.get('[aria-label="Loading Test Metric"]').should('exist')
    })
  })

  describe('error state', () => {
    it('renders error state when error exists', () => {
      const errorSwr = {
        data: undefined,
        isLoading: false,
        error: new Error('Test error'),
        mutate: cy.stub().as('retry'),
      }

      cy.mount(
        <MetricCard
          swr={errorSwr}
          title="Test Metric"
        />
      )

      cy.get('[role="alert"]').should('exist')
      cy.contains('Test Metric').should('exist')
      cy.contains('Retry').should('exist')
    })

    it('calls retry when retry button clicked', () => {
      const errorSwr = {
        data: undefined,
        isLoading: false,
        error: new Error('Test error'),
        mutate: cy.stub().as('retry'),
      }

      cy.mount(
        <MetricCard
          swr={errorSwr}
          title="Test Metric"
        />
      )

      cy.contains('Retry').click()
      cy.get('@retry').should('have.been.called')
    })
  })

  describe('empty state', () => {
    it('renders empty state when no data', () => {
      const emptySwr = {
        data: undefined,
        isLoading: false,
        error: null,
      }

      cy.mount(
        <MetricCard
          swr={emptySwr}
          title="Test Metric"
        />
      )

      cy.contains('-').should('exist')
      cy.contains('Test Metric').should('exist')
    })

    it('renders empty state when data array is empty', () => {
      const emptyArraySwr = {
        data: [],
        isLoading: false,
        error: null,
      }

      cy.mount(
        <MetricCard
          swr={emptyArraySwr}
          title="Test Metric"
        />
      )

      cy.contains('-').should('exist')
    })
  })

  describe('single variant', () => {
    it('renders single value', () => {
      cy.mount(
        <MetricCard
          swr={mockSwr}
          title="Test Metric"
          variant="single"
          value={42}
          unit="queries"
        />
      )

      cy.contains('42').should('exist')
      cy.contains('queries').should('exist')
    })

    it('renders single value with function', () => {
      const dataSwr = {
        data: [{ count: 123 }],
        isLoading: false,
        error: null,
      }

      cy.mount(
        <MetricCard
          swr={dataSwr}
          title="Test Metric"
          variant="single"
          value={(data) => data[0].count}
          unit="items"
        />
      )

      cy.contains('123').should('exist')
      cy.contains('items').should('exist')
    })
  })

  describe('dual variant', () => {
    it('renders dual values', () => {
      const dataSwr = {
        data: [{ value1: 10, value2: 20 }],
        isLoading: false,
        error: null,
      }

      cy.mount(
        <MetricCard
          swr={dataSwr}
          title="Test Metric"
          variant="dual"
          value1={10}
          unit1="reads"
          value2={20}
          unit2="writes"
        />
      )

      cy.contains('10').should('exist')
      cy.contains('reads').should('exist')
      cy.contains('20').should('exist')
      cy.contains('writes').should('exist')
    })
  })

  describe('list variant', () => {
    it('renders list items', () => {
      cy.mount(
        <MetricCard
          swr={mockSwr}
          title="Test Metric"
          variant="list"
          items={[
            { label: 'CPU', value: '50%' },
            { label: 'Memory', value: '2GB' },
          ]}
        />
      )

      cy.contains('CPU').should('exist')
      cy.contains('50%').should('exist')
      cy.contains('Memory').should('exist')
      cy.contains('2GB').should('exist')
    })
  })

  describe('trend variant', () => {
    it('renders trend with positive value', () => {
      cy.mount(
        <MetricCard
          swr={mockSwr}
          title="Test Metric"
          variant="trend"
          value={1000}
          trend={12}
          trendLabel="vs last hour"
        />
      )

      cy.contains('1000').should('exist')
      cy.contains('12').should('exist')
      cy.contains('vs last hour').should('exist')
    })

    it('renders trend with negative value', () => {
      cy.mount(
        <MetricCard
          swr={mockSwr}
          title="Test Metric"
          variant="trend"
          value={1000}
          trend={-5}
          trendLabel="vs last hour"
        />
      )

      cy.contains('1000').should('exist')
      cy.contains('5').should('exist')
    })
  })

  describe('compact mode', () => {
    it('renders compact card', () => {
      cy.mount(
        <MetricCard
          swr={mockSwr}
          title="Test Metric"
          compact
          value={42}
          variant="single"
        />
      )

      cy.contains('Test Metric').should('exist')
      cy.contains('42').should('exist')
    })
  })

  describe('themes', () => {
    const themes = ['default', 'purple', 'blue', 'green', 'orange', 'pink', 'cyan', 'indigo'] as const

    themes.forEach((theme) => {
      it(`renders with ${theme} theme`, () => {
        cy.mount(
          <MetricCard
            swr={mockSwr}
            title="Test Metric"
            theme={theme}
            value={42}
            variant="single"
          />
        )

        cy.contains('Test Metric').should('exist')
        cy.contains('42').should('exist')
      })
    })
  })

  describe('icons', () => {
    it('renders with custom icon', () => {
      cy.mount(
        <MetricCard
          swr={mockSwr}
          title="Test Metric"
          icon={<div data-testid="custom-icon">Custom</div>}
          value={42}
          variant="single"
        />
      )

      cy.get('[data-testid="custom-icon"]').should('exist')
      cy.get('[data-testid="custom-icon"]').contains('Custom')
    })

    it('renders with MetricIcons preset', () => {
      cy.mount(
        <MetricCard
          swr={mockSwr}
          title="Test Metric"
          icon={MetricIcons.Database}
          value={42}
          variant="single"
        />
      )

      cy.contains('Test Metric').should('exist')
      cy.contains('42').should('exist')
    })
  })

  describe('view all link', () => {
    it('renders view all link', () => {
      cy.mount(
        <MetricCard
          swr={mockSwr}
          title="Test Metric"
          viewAllHref="/overview"
          viewAllLabel="See all"
          value={42}
          variant="single"
        />
      )

      cy.contains('See all').should('have.attr', 'href', '/overview')
    })
  })

  describe('description', () => {
    it('renders description', () => {
      cy.mount(
        <MetricCard
          swr={mockSwr}
          title="Test Metric"
          description="This is a test description"
          value={42}
          variant="single"
        />
      )

      cy.contains('Test Metric').should('exist')
      cy.contains('This is a test description').should('exist')
    })
  })

  describe('custom className', () => {
    it('applies custom className', () => {
      cy.mount(
        <MetricCard
          swr={mockSwr}
          title="Test Metric"
          className="custom-test-class"
          value={42}
          variant="single"
        />
      )

      cy.get('.custom-test-class').should('exist')
    })
  })

  describe('custom render', () => {
    it('renders custom content with default variant', () => {
      const dataSwr = {
        data: [{ name: 'Item 1', count: 10 }],
        isLoading: false,
        error: null,
      }

      cy.mount(
        <MetricCard
          swr={dataSwr}
          title="Test Metric"
          variant="default"
        >
          {(data) => (
            <div>
              <span data-testid="custom-name">{data[0].name}</span>
              <span data-testid="custom-count">{data[0].count}</span>
            </div>
          )}
        </MetricCard>
      )

      cy.get('[data-testid="custom-name"]').contains('Item 1')
      cy.get('[data-testid="custom-count"]').contains('10')
    })
  })
})

describe('<MetricIcons />', () => {
  it('exports all icon presets', () => {
    expect(MetricIcons).to.have.property('Activity')
    expect(MetricIcons).to.have.property('Database')
    expect(MetricIcons).to.have.property('HardDrive')
    expect(MetricIcons).to.have.property('Info')
    expect(MetricIcons).to.have.property('Loader')
    expect(MetricIcons).to.have.property('Refresh')
    expect(MetricIcons).to.have.property('TrendingDown')
    expect(MetricIcons).to.have.property('TrendingUp')
  })
})
