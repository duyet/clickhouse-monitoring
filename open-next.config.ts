import type { OpenNextConfig } from '@opennextjs/cloudflare'

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: 'cloudflare-node',
    },
  },
}

export default config