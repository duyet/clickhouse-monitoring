import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

import { appName, gitConfig } from './shared'
import { VersionSwitcher } from '@/components/version-switcher'

// Shared nav/layout options used by both the home (HomeLayout) and docs
// (DocsLayout) pages so the top bar stays consistent across the site.
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-center gap-2 font-medium">
          <img
            src="/brand/logo-mark.svg"
            alt=""
            width={22}
            height={22}
            className="shrink-0"
          />
          {appName}
        </span>
      ),
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    links: [
      {
        text: 'Getting Started',
        url: '/getting-started',
        active: 'nested-url',
      },
      {
        text: 'Features',
        url: '/features',
        active: 'nested-url',
      },
      {
        text: 'Reference',
        url: '/reference/environment-variables',
        active: 'nested-url',
      },
      {
        text: 'Releases',
        url: '/releases',
        active: 'nested-url',
      },
      // Version pill, pinned to the right of the nav (next to GitHub/search).
      {
        type: 'custom',
        children: <VersionSwitcher />,
        secondary: true,
      },
    ],
  }
}
