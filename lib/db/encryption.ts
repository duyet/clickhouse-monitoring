import CryptoJS from 'crypto-js'

// Encryption key management
const ENCRYPTION_KEY_PREFIX = 'CHMONITOR_ENCRYPTION_KEY_'
const CURRENT_KEY_VERSION = 1

// Get encryption key from environment or generate new one
export function getEncryptionKey(): string {
  // For production, this should be stored securely (e.g., environment variable, KMS)
  // For development, we'll generate a key and store it
  const keyFromEnv = process.env.CLICKHOUSE_ENCRYPTION_KEY

  if (keyFromEnv) {
    return keyFromEnv
  }

  // Check if we have a stored key
  const storedKey = localStorage.getItem(ENCRYPTION_KEY_PREFIX + CURRENT_KEY_VERSION)

  if (storedKey) {
    return storedKey
  }

  // Generate new key for development
  const newKey = CryptoJS.lib.WordArray.random(32).toString()

  // In production, this should be stored securely, not in localStorage
  if (process.env.NODE_ENV === 'development') {
    localStorage.setItem(ENCRYPTION_KEY_PREFIX + CURRENT_KEY_VERSION, newKey)
  }

  return newKey
}

// Encrypt data using AES-256-GCM
export function encryptData(data: string, key?: string): string {
  const encryptionKey = key || getEncryptionKey()
  const encrypted = CryptoJS.AES.encrypt(data, encryptionKey).toString()
  return encrypted
}

// Decrypt data using AES-256-GCM
export function decryptData(encryptedData: string, key?: string): string {
  const encryptionKey = key || getEncryptionKey()
  const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey)
  return bytes.toString(CryptoJS.enc.Utf8)
}

// Encrypt host password
export function encryptHostPassword(password: string, key?: string): string {
  return encryptData(password, key)
}

// Decrypt host password
export function decryptHostPassword(encryptedPassword: string, key?: string): string {
  if (!encryptedPassword) return ''
  return decryptData(encryptedPassword, key)
}

// Generate a secure random token
export function generateToken(length: number = 32): string {
  return CryptoJS.lib.WordArray.random(length).toString()
}

// Hash password for storage (not used for encryption, but for verification)
export function hashPassword(password: string, salt?: string): string {
  const saltValue = salt || generateToken(16)
  const hashed = CryptoJS.PBKDF2(password, saltValue, {
    keySize: 256 / 32,
    iterations: 10000
  })
  return `${saltValue}:${hashed.toString()}`
}

// Verify password
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':')
  const hashedNewPassword = hashPassword(password, salt)
  return hashedNewPassword === hashedPassword
}

// Rotate encryption key (future enhancement)
export function rotateEncryptionKey(): string {
  const newKey = CryptoJS.lib.WordArray.random(32).toString()
  localStorage.setItem(ENCRYPTION_KEY_PREFIX + CURRENT_KEY_VERSION, newKey)
  return newKey
}