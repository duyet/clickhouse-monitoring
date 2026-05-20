import { defineConfig } from 'deepsec/config'

export default defineConfig({
  projects: [
    { id: 'clickhouse-monitor', root: '..' },
    // <deepsec:projects-insert-above>
  ],
})
