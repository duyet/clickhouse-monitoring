import { decryptCredentials, encryptCredentials } from '../crypto'
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'

describe('connection-store crypto', () => {
  const originalKey = process.env.CHM_USER_CONNECTIONS_ENCRYPTION_KEY

  beforeEach(() => {
    // 32 zero bytes, base64
    process.env.CHM_USER_CONNECTIONS_ENCRYPTION_KEY =
      'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
  })

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.CHM_USER_CONNECTIONS_ENCRYPTION_KEY
    } else {
      process.env.CHM_USER_CONNECTIONS_ENCRYPTION_KEY = originalKey
    }
  })

  it('round-trips credentials', async () => {
    const input = {
      host: 'https://clickhouse.example.com:8443',
      user: 'default',
      password: 'secret',
    }
    const encrypted = await encryptCredentials(input)
    const decrypted = await decryptCredentials(encrypted)
    expect(decrypted).toEqual(input)
  })
})
