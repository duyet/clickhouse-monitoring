import Script from 'next/script'

export default {
  logo: <span>ClickHouse Monitoring</span>,
  project: {
    link: 'https://github.com/duyet/clickhouse-monitoring',
  },
  head: (
    <>
      <Script
        async
        src="https://cdn.seline.so/seline.js"
        data-token="05046b3773d0534"
      />
      <Script
        async
        src="https://cm43x9afh00003b61bdnjgdkj.d.jitsu.com/p.js"
      />
    </>
  ),
}
