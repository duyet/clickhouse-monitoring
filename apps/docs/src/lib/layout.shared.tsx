import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import { appName, gitConfig } from './shared'

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
        text: 'Dashboard',
        url: 'https://dash.chmonitor.dev',
        active: 'none',
        external: true,
      },
      {
        text: 'Releases',
        url: '/releases',
        active: 'nested-url',
      },
    ],
  }
}
