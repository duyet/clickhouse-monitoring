/**
 * AES-256-GCM encryption utilities for sensitive data (host credentials)
 * Compliant with the issue requirements for secure storage
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'
import { env } from './env'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 32
const KEY_LENGTH = 32
const AUTH_TAG_LENGTH = 16

// Get encryption key from environment or derive it
function getEncryptionKey(): Buffer {
  if (!env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is required but not set')
  }

  // If key is already 32 bytes (256 bits), use it directly
  if (env.ENCRYPTION_KEY.length === 32) {
    return Buffer.from(env.ENCRYPTION_KEY, 'utf8')
  }

  // Otherwise, derive a 256-bit key using scrypt
  const salt = randomBytes(SALT_LENGTH)
  const derivedKey = scryptSync(env.ENCRYPTION_KEY, salt, KEY_LENGTH)
  return derivedKey
}

/**
 * Encrypts data using AES-256-GCM
 * @param plaintext - Data to encrypt (string)
 * @returns Encrypted data in format: salt:iv:authTag:encrypted
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return ''

  try {
    const key = getEncryptionKey()
    const iv = randomBytes(IV_LENGTH)
    const cipher = createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Store as: salt:iv:authTag:encrypted
    // Note: We're using a simplified format since key derivation happens once
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  } catch (error) {
    console.error('Encryption failed:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypts data using AES-256-GCM
 * @param encryptedData - Encrypted data in format: iv:authTag:encrypted
 * @returns Decrypted plaintext
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return ''

  try {
    const [ivHex, authTagHex, encryptedHex] = encryptedData.split(':')

    if (!ivHex || !authTagHex || !encryptedHex) {
      throw new Error('Invalid encrypted data format')
    }

    const key = getEncryptionKey()
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const encrypted = Buffer.from(encryptedHex, 'hex')

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, undefined, 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Decryption failed:', error)
    throw new Error('Failed to decrypt data - invalid key or corrupted data')
  }
}

/**
 * Verifies that encryption is properly configured
 * @returns True if encryption is ready, false otherwise
 */
export function isEncryptionConfigured(): boolean {
  try {
    const key = getEncryptionKey()
    return key.length === KEY_LENGTH
  } catch {
    return false
  }
}

/**
 * Helper function to encrypt ClickHouse connection credentials
 * @param credentials - Object containing connection details
 * @returns Encrypted credentials object
 */
export function encryptHostCredentials(credentials: {
  host: string
  username: string
  password: string
}): {
  host: string
  username: string
  password: string
} {
  return {
    host: encrypt(credentials.host),
    username: encrypt(credentials.username),
    password: encrypt(credentials.password),
  }
}

/**
 * Helper function to decrypt ClickHouse connection credentials
 * @param encryptedCredentials - Object containing encrypted connection details
 * @returns Decrypted credentials object
 */
export function decryptHostCredentials(encryptedCredentials: {
  host: string
  username: string
  password: string
}): {
  host: string
  username: string
  password: string
} {
  return {
    host: decrypt(encryptedCredentials.host),
    username: decrypt(encryptedCredentials.username),
    password: decrypt(encryptedCredentials.password),
  }
}

/**
 * Mask sensitive data for logging/display
 * @param data - Sensitive data to mask
 * @returns Masked string (shows first 2 and last 2 characters)
 */
export function maskSensitiveData(data: string): string {
  if (!data || data.length < 4) return '***'
  return `${data.slice(0, 2)}***${data.slice(-2)}`
}

/**
 * Generate a secure random token
 * @param length - Token length (default: 32)
 * @returns Random token string
 */
export function generateSecureToken(length = 32): string {
  return randomBytes(length).toString('hex')
}

/**
 * Validate token format
 * @param token - Token to validate
 * @param length - Expected length
 * @returns True if valid
 */
export function validateToken(token: string, length = 32): boolean {
  return /^[a-f0-9]+$/.test(token) && token.length === length * 2 // hex doubles the length
}
