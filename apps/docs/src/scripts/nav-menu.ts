export function openMobileNavModal(): void {
  const modal = document.getElementById(
    'mobile-nav-modal'
  ) as HTMLDialogElement | null
  if (!modal) return
  if (!modal.open) {
    modal.showModal()
    requestAnimationFrame(() => {
      const searchInput = modal.querySelector<HTMLInputElement>(
        '[data-mobile-nav-search]'
      )
      searchInput?.focus()
    })
  }
  syncMobileNavTriggers(true)
}

export function closeMobileNavModal(): void {
  const modal = document.getElementById(
    'mobile-nav-modal'
  ) as HTMLDialogElement | null
  modal?.close()
}

function syncMobileNavTriggers(open: boolean): void {
  for (const id of ['mobile-nav-toggle', 'sidebar-toggle']) {
    document
      .getElementById(id)
      ?.setAttribute('aria-expanded', open ? 'true' : 'false')
  }
}

export function initMobileNavMenu(): void {
  const modal = document.getElementById(
    'mobile-nav-modal'
  ) as HTMLDialogElement | null
  const searchInput = document.querySelector<HTMLInputElement>(
    '[data-mobile-nav-search]'
  )
  if (!modal) return

  for (const btn of document.querySelectorAll('[data-close-mobile-nav]')) {
    btn.addEventListener('click', () => closeMobileNavModal())
  }

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      closeMobileNavModal()
    }
  })

  const resetMobileNavFilter = () => {
    for (const section of document.querySelectorAll<HTMLElement>(
      '[data-mobile-nav-section]'
    )) {
      section.hidden = false
    }
    const browse = document.querySelector<HTMLElement>(
      '[data-mobile-nav-browse]'
    )
    if (browse) browse.hidden = false

    for (const category of document.querySelectorAll<HTMLDetailsElement>(
      '[data-mobile-nav-category]'
    )) {
      category.hidden = false
      category.open = category.dataset.defaultOpen === 'true'
      for (const item of category.querySelectorAll<HTMLElement>(
        '[data-mobile-nav-item]'
      )) {
        item.hidden = false
      }
      for (const heading of category.querySelectorAll<HTMLElement>(
        '.mobile-nav-accordion__subheading'
      )) {
        heading.hidden = false
      }
    }
  }

  searchInput?.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase()
    if (!query) {
      resetMobileNavFilter()
      return
    }

    const currentSection = document.querySelector<HTMLElement>(
      '[data-mobile-nav-section]'
    )
    if (currentSection) {
      let sectionVisible = 0
      for (const link of currentSection.querySelectorAll<HTMLElement>(
        '.nav-row'
      )) {
        const label =
          link.querySelector('.nav-row__label')?.textContent?.toLowerCase() ??
          ''
        const match = label.includes(query)
        link.hidden = !match
        if (match) sectionVisible++
      }
      currentSection.hidden = sectionVisible === 0
    }

    const browse = document.querySelector<HTMLElement>(
      '[data-mobile-nav-browse]'
    )
    let browseVisible = 0

    for (const category of document.querySelectorAll<HTMLDetailsElement>(
      '[data-mobile-nav-category]'
    )) {
      const items = category.querySelectorAll<HTMLElement>(
        '[data-mobile-nav-item]'
      )
      let visible = 0

      for (const item of items) {
        const label = item.dataset.mobileNavLabel ?? ''
        const match = label.includes(query)
        item.hidden = !match
        if (match) visible++
      }

      for (const heading of category.querySelectorAll<HTMLElement>(
        '.mobile-nav-accordion__subheading'
      )) {
        let sectionVisible = false
        let sibling = heading.nextElementSibling
        while (
          sibling &&
          !sibling.classList.contains('mobile-nav-accordion__subheading')
        ) {
          if (
            sibling instanceof HTMLElement &&
            sibling.matches('[data-mobile-nav-item]') &&
            !sibling.hidden
          ) {
            sectionVisible = true
            break
          }
          sibling = sibling.nextElementSibling
        }
        heading.hidden = !sectionVisible
      }

      const catLabel =
        category
          .querySelector('.mobile-nav-accordion__label')
          ?.textContent?.toLowerCase() ?? ''
      const catMatch = catLabel.includes(query)
      category.open = visible > 0 || catMatch
      category.hidden = visible === 0 && !catMatch
      if (!category.hidden) browseVisible++
    }

    for (const solo of document.querySelectorAll<HTMLElement>(
      '.mobile-nav-accordion__solo'
    )) {
      const label = solo.textContent?.toLowerCase() ?? ''
      const match = label.includes(query)
      solo.hidden = !match
      if (match) browseVisible++
    }

    if (browse) browse.hidden = browseVisible === 0
  })

  modal.addEventListener('close', () => {
    if (searchInput) searchInput.value = ''
    resetMobileNavFilter()
    syncMobileNavTriggers(false)
  })

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeMobileNavModal()
  })

  for (const link of document.querySelectorAll<HTMLAnchorElement>(
    '.mobile-nav-accordion__link, .mobile-nav-accordion__solo, .mobile-nav-section--current .nav-row'
  )) {
    link.addEventListener('click', () => closeMobileNavModal())
  }
}

export function initDocsNavShell(): void {
  const root = document.documentElement
  const desktopMq = window.matchMedia('(min-width: 1024px)')
  const subnavMq = window.matchMedia('(min-width: 768px)')
  const sidebarToggle = document.getElementById('sidebar-toggle')
  const mobileNavToggle = document.getElementById('mobile-nav-toggle')
  const mobileNavModal = document.getElementById(
    'mobile-nav-modal'
  ) as HTMLDialogElement | null

  const isDesktop = () => desktopMq.matches

  const syncSidebarToggle = () => {
    if (!isDesktop()) return
    const collapsed = root.getAttribute('data-sidebar') === 'collapsed'
    sidebarToggle?.setAttribute('aria-expanded', collapsed ? 'false' : 'true')
  }

  const initSidebar = () => {
    if (isDesktop()) {
      const stored = localStorage.getItem('sidebar')
      root.setAttribute(
        'data-sidebar',
        stored === 'collapsed' ? 'collapsed' : 'expanded'
      )
    } else {
      root.setAttribute('data-sidebar', 'collapsed')
    }
    syncSidebarToggle()
  }

  const syncHeaderHeight = () => {
    root.setAttribute(
      'data-header-compact',
      subnavMq.matches ? 'false' : 'true'
    )
  }

  initSidebar()
  syncHeaderHeight()
  desktopMq.addEventListener('change', initSidebar)
  subnavMq.addEventListener('change', syncHeaderHeight)

  const toggleMobileMenu = () => {
    if (!mobileNavModal) return
    if (mobileNavModal.open) {
      closeMobileNavModal()
    } else {
      openMobileNavModal()
    }
  }

  sidebarToggle?.addEventListener('click', () => {
    if (isDesktop()) {
      const collapsed = root.getAttribute('data-sidebar') === 'collapsed'
      root.setAttribute('data-sidebar', collapsed ? 'expanded' : 'collapsed')
      try {
        localStorage.setItem('sidebar', collapsed ? 'expanded' : 'collapsed')
      } catch {}
      syncSidebarToggle()
      return
    }
    toggleMobileMenu()
  })

  mobileNavToggle?.addEventListener('click', toggleMobileMenu)

  document.addEventListener('click', (e) => {
    if (!isDesktop() || root.getAttribute('data-sidebar') !== 'expanded') return
    const sidebar = document.querySelector('.sidebar')
    const target = e.target as Node
    if (sidebar?.contains(target) || sidebarToggle?.contains(target)) return
    root.setAttribute('data-sidebar', 'collapsed')
    syncSidebarToggle()
  })

  initMobileNavMenu()
}
