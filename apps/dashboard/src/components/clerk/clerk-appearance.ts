/**
 * Theme Clerk's hosted UI (OrganizationProfile, UserButton, the sign-in/up
 * modal, OrganizationSwitcher) to the dashboard's shadcn / OKLCH design tokens
 * so the account surfaces match the rest of the app instead of Clerk's default
 * blue.
 *
 * The values reference the SAME CSS variables defined in `styles.css`
 * (`:root` + `.dark`). Clerk renders its components inside the app DOM — which
 * carries the `.dark` class in dark mode — so `var(--primary)` resolves to the
 * active theme automatically. One config themes both light and dark, and it
 * tracks any future token change with no extra wiring.
 *
 * Passed to `<ClerkProvider appearance={…}>` (clerk-auth-provider.tsx), so it
 * cascades to every Clerk component. Typed structurally against the provider's
 * `appearance` prop at the usage site — no `@clerk/types` import needed.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: 'var(--primary)',
    colorText: 'var(--foreground)',
    colorTextSecondary: 'var(--muted-foreground)',
    colorTextOnPrimaryBackground: 'var(--primary-foreground)',
    colorBackground: 'var(--card)',
    colorInputBackground: 'var(--background)',
    colorInputText: 'var(--foreground)',
    colorDanger: 'var(--destructive)',
    borderRadius: 'var(--radius)',
    fontFamily: 'inherit',
  },
  elements: {
    // Match the flat shadcn card/button look (drop Clerk's gradient + heavy
    // shadow). These utilities already exist app-wide, so Tailwind v4 emits them.
    card: 'border border-border shadow-sm',
    formButtonPrimary:
      'bg-primary text-primary-foreground shadow-none hover:bg-primary/90',
  },
} as const
