/**
 * AES-256-GCM encryption for ClickHouse passwords
 * Uses authenticated encryption with derived keys from AUTH_SECRET
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scrypt,
} from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const TAG_LENGTH = 16
const SALT = 'clickhouse-monitor-salt'

/**
 * Error thrown when encryption is not available
 */
export class EncryptionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EncryptionError'
  }
}

/**
 * Derive encryption key from AUTH_SECRET using scrypt
 */
async function deriveKey(secret: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(secret, SALT, KEY_LENGTH, (err, key) => {
      if (err)
        reject(new EncryptionError(`Key derivation failed: ${err.message}`))
      else resolve(key)
    })
  })
}

/**
 * Check if encryption is available (AUTH_SECRET is set)
 */
export function isEncryptionAvailable(): boolean {
  return !!process.env.AUTH_SECRET
}

/**
 * Get AUTH_SECRET or throw if not available
 */
function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new EncryptionError(
      'AUTH_SECRET is not set. Encryption is not available.'
    )
  }
  return secret
}

/**
 * Encrypt password using AES-256-GCM
 *
 * @param password - Plain text password to encrypt
 * @returns Base64-encoded string in format: iv + tag + encrypted
 * @throws EncryptionError if AUTH_SECRET is not set or encryption fails
 *
 * @example
 * const encrypted = await encryptPassword('my-password')
 * // Returns: base64(iv + tag + encrypted)
 */
export async function encryptPassword(password: string): Promise<string> {
  const secret = getAuthSecret()
  const key = await deriveKey(secret)
  const iv = randomBytes(IV_LENGTH)

  try {
    const cipher = createCipheriv(ALGORITHM, key, iv)

    const encrypted = Buffer.concat([
      cipher.update(password, 'utf8'),
      cipher.final(),
    ])
    const tag = cipher.getAuthTag()

    // Format: base64(iv + tag + encrypted)
    return Buffer.concat([iv, tag, encrypted]).toString('base64')
  } catch (error) {
    throw new EncryptionError(
      `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Decrypt password using AES-256-GCM
 *
 * @param encrypted - Base64-encoded encrypted string
 * @returns Decrypted plain text password
 * @throws EncryptionError if AUTH_SECRET is not set, decryption fails, or data is corrupted
 *
 * @example
 * const password = await decryptPassword(encrypted)
 */
export async function decryptPassword(encrypted: string): Promise<string> {
  const secret = getAuthSecret()
  const key = await deriveKey(secret)

  try {
    const data = Buffer.from(encrypted, 'base64')

    // Validate minimum length
    if (data.length < IV_LENGTH + TAG_LENGTH) {
      throw new EncryptionError('Invalid encrypted data: too short')
    }

    const iv = data.subarray(0, IV_LENGTH)
    const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
    const ciphertext = data.subarray(IV_LENGTH + TAG_LENGTH)

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    return decipher.update(ciphertext) + decipher.final('utf8')
  } catch (error) {
    if (error instanceof EncryptionError) {
      throw error
    }
    throw new EncryptionError(
      `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
