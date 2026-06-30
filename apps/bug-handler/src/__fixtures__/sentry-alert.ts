// Realistic raw MIME samples used across test files.
// The Sentry alert is a multipart/alternative message with both text and HTML parts.

/** Multipart text+html Sentry alert email */
export const SENTRY_ALERT_MIME = `MIME-Version: 1.0
From: Sentry Alerts <alerts@sentry.io>
To: bug@chmonitor.dev
Subject: [Sentry] Error: TypeError: Cannot read properties of null in ClickHouseClient
Date: Mon, 30 Jun 2026 10:15:00 +0000
Message-ID: <chmonitor-sentry-001@sentry.io>
Content-Type: multipart/alternative; boundary="----=_Part_001"

------=_Part_001
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: quoted-printable

Sentry Alert — New Issue

Project: chmonitor-dashboard
Environment: production
Level: error
Short ID: CHMONITOR-1A2B
Culprit: src/lib/clickhouse.ts in fetchData

A new issue has been detected in your project.

TypeError: Cannot read properties of null (reading 'query')
  at fetchData (src/lib/clickhouse.ts:42)
  at async GET (src/routes/api/v1/data.ts:18)

View this issue on Sentry:
https://chmonitor.sentry.io/issues/4567890/

To unsubscribe from these alerts, visit your Sentry notification settings.

------=_Part_001
Content-Type: text/html; charset=UTF-8
Content-Transfer-Encoding: quoted-printable

<!DOCTYPE html>
<html>
<body>
<h2>Sentry Alert — New Issue</h2>
<p><strong>Project:</strong> chmonitor-dashboard</p>
<p><strong>Environment:</strong> production</p>
<p><strong>Level:</strong> error</p>
<p><a href="https://chmonitor.sentry.io/issues/4567890/">View on Sentry</a></p>
</body>
</html>

------=_Part_001--
`

/** Plain-text-only email (no Sentry metadata) */
export const PLAIN_EMAIL_MIME = `MIME-Version: 1.0
From: John Doe <john@example.com>
To: bug@chmonitor.dev
Subject: Something looks broken on the dashboard
Date: Mon, 30 Jun 2026 11:00:00 +0000
Message-ID: <plain-001@example.com>
Content-Type: text/plain; charset=UTF-8

Hi team,

I noticed the queries page is showing stale data after the latest deploy.
Refreshing does not help.

Steps to reproduce:
1. Go to /running-queries
2. Wait 30 seconds
3. Data does not update

Let me know if you need more info.

— John
`

/** Encode a MIME string as a ReadableStream<Uint8Array> (mirrors message.raw) */
export function mimeToStream(mime: string): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(mime)
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes)
      controller.close()
    },
  })
}
