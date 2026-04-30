import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const WASM_BINDGEN_VERSION = '0.2.105'
const root = resolve(import.meta.dir, '..')
const manifestPath = resolve(root, 'rust/monitor-core/Cargo.toml')
const wasmPath = resolve(
  root,
  'rust/monitor-core/target/wasm32-unknown-unknown/release/monitor_core.wasm'
)
const outDir = resolve(root, 'lib/wasm/generated')

function run(command: string[], options: { quiet?: boolean } = {}) {
  const result = Bun.spawnSync(command, {
    cwd: root,
    stdout: options.quiet ? 'pipe' : 'inherit',
    stderr: options.quiet ? 'pipe' : 'inherit',
  })

  if (!result.success) {
    const stderr = result.stderr?.toString()
    throw new Error(
      `Command failed: ${command.join(' ')}${stderr ? `\n${stderr}` : ''}`
    )
  }

  return result.stdout?.toString().trim() ?? ''
}

function ensureWasmTarget() {
  const installedTargets = run(['rustup', 'target', 'list', '--installed'], {
    quiet: true,
  })

  if (!installedTargets.split('\n').includes('wasm32-unknown-unknown')) {
    run(['rustup', 'target', 'add', 'wasm32-unknown-unknown'])
  }
}

function ensureWasmBindgen() {
  let currentVersion = ''
  try {
    currentVersion = run(['wasm-bindgen', '--version'], { quiet: true })
  } catch {
    // Install below.
  }

  if (currentVersion.includes(WASM_BINDGEN_VERSION)) {
    return
  }

  run([
    'cargo',
    'install',
    '--locked',
    'wasm-bindgen-cli',
    '--version',
    WASM_BINDGEN_VERSION,
  ])
}

function formatGeneratedTypes() {
  const biomePath = resolve(root, 'node_modules/.bin/biome')
  if (!existsSync(biomePath)) {
    return
  }

  run([biomePath, 'format', '--write', resolve(outDir, 'monitor_core.d.ts')])
}

ensureWasmTarget()
run([
  'cargo',
  'build',
  '--manifest-path',
  manifestPath,
  '--target',
  'wasm32-unknown-unknown',
  '--release',
])

ensureWasmBindgen()

if (existsSync(outDir)) {
  rmSync(outDir, { recursive: true, force: true })
}
mkdirSync(dirname(outDir), { recursive: true })

run([
  'wasm-bindgen',
  wasmPath,
  '--target',
  'web',
  '--out-dir',
  outDir,
  '--out-name',
  'monitor_core',
])

formatGeneratedTypes()
