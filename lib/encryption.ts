import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex")

/**
 * Encrypts data using AES-256-GCM
 * @param data - Data to encrypt (string or object)
 * @returns Encrypted data with IV and auth tag
 */
export function encrypt(data: string | object): { encrypted: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY)

  let dataString: string
  if (typeof data === "object") {
    dataString = JSON.stringify(data)
  } else {
    dataString = data
  }

  let encrypted = cipher.update(dataString, "utf8", "hex")
  encrypted += cipher.final("hex")

  const tag = cipher.getAuthTag()

  return {
    encrypted,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  }
}

/**
 * Decrypts data using AES-256-GCM
 * @param encrypted - Encrypted data
 * @param iv - Initialization vector
 * @param tag - Authentication tag
 * @returns Decrypted data as string
 */
export function decrypt(encrypted: string, iv: string, tag: string): string {
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY)
  decipher.setAuthTag(Buffer.from(tag, "hex"))

  let decrypted = decipher.update(encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}

/**
 * Encrypts host credentials for storage
 * @param credentials - Host credentials object
 * @returns Encrypted credentials with metadata
 */
export function encryptHostCredentials(credentials: {
  host: string
  port: number
  username: string
  password: string
  database?: string
}): { encrypted: string; iv: string; tag: string } {
  return encrypt(credentials)
}

/**
 * Decrypts host credentials
 * @param encrypted - Encrypted credentials
 * @param iv - Initialization vector
 * @param tag - Authentication tag
 * @returns Decrypted credentials object
 */
export function decryptHostCredentials(
  encrypted: string,
  iv: string,
  tag: string
): {
  host: string
  port: number
  username: string
  password: string
  database?: string
} {
  const decrypted = decrypt(encrypted, iv, tag)
  return JSON.parse(decrypted)
}

/**
 * Hashes a password using bcrypt
 * @param password - Password to hash
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import("bcryptjs")
  return bcrypt.hash(password, 12)
}

/**
 * Verifies a password against a hash
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns Boolean indicating if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import("bcryptjs")
  return bcrypt.compare(password, hash)
}

/**
 * Generates a secure random token
 * @param length - Token length (default: 32)
 * @returns Random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex")
}

/**
 * Validates that encryption key is sufficiently strong
 * @throws Error if key is too weak
 */
export function validateEncryptionKey(): void {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 64) {
    throw new Error(
      "Encryption key must be at least 64 characters (32 bytes). " +
      "Set ENCRYPTION_KEY environment variable with a secure random string."
    )
  }
}

// Validate encryption key on import
validateEncryptionKey()