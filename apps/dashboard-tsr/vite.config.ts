import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Plugin order is load-bearing for the Cloudflare target:
//  - cloudflare() retargets the SSR environment to the workerd runtime
//  - tanstackStart() generates routeTree.gen.ts and wires SSR/server routes
//  - viteReact() MUST come after tanstackStart()
// tailwindcss() (Tailwind v4) is order-independent; kept first by convention.
export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tailwindcss(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart(),
    viteReact(),
  ],
})
