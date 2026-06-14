/**
 * Keeper type detection.
 *
 * ClickHouse Keeper reports the _ClickHouse server_ version (e.g. "v26.1.3.52-stable-…"
 * or just "26.1.3.52"), because it is bundled inside the ClickHouse binary.
 * Apache ZooKeeper follows its own versioning on the 3.x line (e.g. "3.8.4").
 *
 * Detection rules (applied in priority order):
 *  1. The string contains the word "keeper"  → ClickHouse Keeper
 *  2. Known ClickHouse build suffixes present ("-stable", "-lts", "-testing") → ClickHouse Keeper
 *  3. Major version ≥ 18 (ClickHouse started at v1.x in 2016, jumped to 18.x;
 *     ZooKeeper never reached 18)  → ClickHouse Keeper
 *  4. Major version === 3  → Apache ZooKeeper
 *  5. Otherwise  → unknown
 */

export type KeeperType = 'clickhouse-keeper' | 'zookeeper' | 'unknown'

/** Strip a leading "v" and return the normalised lowercase string. */
function normalise(version: string): string {
  return version.replace(/^v/i, '').toLowerCase().trim()
}

/** Extract the numeric major version from the normalised version string. */
function majorVersion(norm: string): number | null {
  const match = /^(\d+)/.exec(norm)
  return match ? Number.parseInt(match[1], 10) : null
}

export function detectKeeperType(version?: string | null): KeeperType {
  if (!version) return 'unknown'

  const norm = normalise(version)

  // Rule 1: explicit "keeper" substring
  if (norm.includes('keeper')) return 'clickhouse-keeper'

  // Rule 2: ClickHouse release-channel suffixes
  if (/-stable|-lts|-testing/.test(norm)) return 'clickhouse-keeper'

  // Rule 3 / 4: major-version heuristic
  const major = majorVersion(norm)
  if (major === null) return 'unknown'
  if (major >= 18) return 'clickhouse-keeper'
  if (major === 3) return 'zookeeper'

  return 'unknown'
}
