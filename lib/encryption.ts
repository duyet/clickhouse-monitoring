import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const _TAG_LENGTH = 16

/**
 * Derive a 32-byte key from the provided encryption key using scrypt
 */
function getKey(encryptionKey: string): Buffer {
  return scryptSync(encryptionKey, 'salt', 32)
}

/**
 * Encrypt data using AES-256-GCM
 */
export function encrypt(
  text: string,
  encryptionKey: string
): { encrypted: string; iv: string; tag: string } {
  const key = getKey(encryptionKey)
  const iv = randomBytes(IV_LENGTH)

  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const tag = cipher.getAuthTag()

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  }
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decrypt(
  encrypted: string,
  iv: string,
  tag: string,
  encryptionKey: string
): string {
  const key = getKey(encryptionKey)

  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'))
  decipher.setAuthTag(Buffer.from(tag, 'hex'))

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Encrypt credentials object for storage
 */
export function encryptCredentials(
  credentials: { username?: string; password?: string },
  encryptionKey: string
): string {
  const credentialsJson = JSON.stringify(credentials)
  const { encrypted, iv, tag } = encrypt(credentialsJson, encryptionKey)
  return JSON.stringify({ encrypted, iv, tag })
}

/**
 * Decrypt credentials from stored string
 */
export function decryptCredentials(
  stored: string,
  encryptionKey: string
): { username?: string; password?: string } | null {
  try {
    const { encrypted, iv, tag } = JSON.parse(stored)
    const decrypted = decrypt(encrypted, iv, tag, encryptionKey)
    return JSON.parse(decrypted)
  } catch {
    return null
  }
}

/**
 * Generate a random encryption key
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex')
}
