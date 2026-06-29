/**
 * Server-side AES-256-GCM encryption for user connection credentials.
 */

import type { ConnectionCredentials } from './types'

const ALGORITHM = 'AES-GCM'
const IV_LENGTH = 12
const VERSION = 1

function readEncryptionKeyMaterial(): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    const fromProcess = process.env.CHM_USER_CONNECTIONS_ENCRYPTION_KEY
    if (fromProcess) return fromProcess
  }
  return undefined
}

async function importKeyMaterial(keyBase64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(keyBase64.trim()), (c) => c.charCodeAt(0))
  if (raw.length !== 32) {
    throw new Error(
      'CHM_USER_CONNECTIONS_ENCRYPTION_KEY must be 32 bytes (base64-encoded)'
    )
  }
  return crypto.subtle.importKey('raw', raw, { name: ALGORITHM }, false, [
    'encrypt',
    'decrypt',
  ])
}

export function isEncryptionConfigured(): boolean {
  return Boolean(readEncryptionKeyMaterial())
}

export async function encryptCredentials(
  credentials: ConnectionCredentials
): Promise<string> {
  const keyMaterial = readEncryptionKeyMaterial()
  if (!keyMaterial) {
    throw new Error('CHM_USER_CONNECTIONS_ENCRYPTION_KEY is not configured')
  }
  const key = await importKeyMaterial(keyMaterial)
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const plaintext = new TextEncoder().encode(JSON.stringify(credentials))
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    plaintext
  )

  const payload = new Uint8Array(1 + IV_LENGTH + ciphertext.byteLength)
  payload[0] = VERSION
  payload.set(iv, 1)
  payload.set(new Uint8Array(ciphertext), 1 + IV_LENGTH)

  return btoa(String.fromCharCode(...payload))
}

export async function decryptCredentials(
  encrypted: string
): Promise<ConnectionCredentials> {
  const keyMaterial = readEncryptionKeyMaterial()
  if (!keyMaterial) {
    throw new Error('CHM_USER_CONNECTIONS_ENCRYPTION_KEY is not configured')
  }
  const key = await importKeyMaterial(keyMaterial)
  const payload = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0))

  if (payload[0] !== VERSION) {
    throw new Error('Unsupported encryption version')
  }

  const iv = payload.slice(1, 1 + IV_LENGTH)
  const ciphertext = payload.slice(1 + IV_LENGTH)

  const plaintext = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  )

  return JSON.parse(
    new TextDecoder().decode(plaintext)
  ) as ConnectionCredentials
}
