#!/usr/bin/env bun

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'

const SUCCESS_MARKER = '[prerender] - /'
const REQUIRED_ARTIFACTS = ['.output/server/index.mjs', '.output/nitro.json']
const TIMEOUT_MS = 10 * 60 * 1000
const GRACE_MS = 5_000

let sawSuccessMarker = false
let settled = false
let graceTimer: ReturnType<typeof setTimeout> | undefined
let recentOutput = ''

const child = spawn('bun', ['run', 'build:node'], {
  detached: true,
  env: {
    ...process.env,
    BUILD_TARGET: 'node',
    CHM_SKIP_PRERENDER: '1',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
})

function artifactsExist() {
  return REQUIRED_ARTIFACTS.every((path) => existsSync(path))
}

function stopChild(signal: NodeJS.Signals = 'SIGTERM') {
  if (!child.pid) return
  try {
    process.kill(-child.pid, signal)
  } catch {
    try {
      child.kill(signal)
    } catch {
      /* already gone */
    }
  }
}

function finish(code: number) {
  if (settled) return
  settled = true
  if (graceTimer) clearTimeout(graceTimer)
  clearTimeout(timeout)
  process.exit(code)
}

function scheduleSuccessfulShutdown() {
  if (!sawSuccessMarker || !artifactsExist() || graceTimer || settled) return

  graceTimer = setTimeout(() => {
    if (settled) return
    console.log(
      'TSR node build produced expected artifacts; stopping lingering build process.'
    )
    stopChild()
    finish(0)
  }, GRACE_MS)
}

function stream(chunk: Buffer, target: NodeJS.WriteStream) {
  const text = chunk.toString()
  target.write(text)
  recentOutput = (recentOutput + text).slice(-SUCCESS_MARKER.length * 2)
  if (recentOutput.includes(SUCCESS_MARKER)) {
    sawSuccessMarker = true
    scheduleSuccessfulShutdown()
  }
}

const timeout = setTimeout(() => {
  console.error(`TSR node build did not complete within ${TIMEOUT_MS / 1000}s.`)
  stopChild()
  finish(1)
}, TIMEOUT_MS)

child.stdout.on('data', (chunk) => stream(chunk, process.stdout))
child.stderr.on('data', (chunk) => stream(chunk, process.stderr))

child.on('error', (error) => {
  console.error(error)
  finish(1)
})

child.on('exit', (code, signal) => {
  if (settled) return
  if (code === 0) {
    if (artifactsExist()) {
      finish(0)
      return
    }

    console.error(
      `TSR node build exited successfully, but required artifacts are missing: ${REQUIRED_ARTIFACTS.join(', ')}`
    )
    finish(1)
    return
  }

  if (sawSuccessMarker && artifactsExist() && signal === 'SIGTERM') {
    finish(0)
    return
  }

  finish(code ?? 1)
})
