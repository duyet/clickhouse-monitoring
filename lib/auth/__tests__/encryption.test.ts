/**
 * Tests for AES-256-GCM password encryption
 */

import {
  decryptPassword,
  EncryptionError,
  encryptPassword,
  isEncryptionAvailable,
} from '../encryption'

describe('Encryption', () => {
  const originalAuthSecret = process.env.AUTH_SECRET

  beforeEach(() => {
    // Set AUTH_SECRET for tests
    process.env.AUTH_SECRET = 'test-secret-key-for-encryption-testing'
  })

  afterEach(() => {
    // Restore original AUTH_SECRET
    if (originalAuthSecret) {
      process.env.AUTH_SECRET = originalAuthSecret
    } else {
      delete process.env.AUTH_SECRET
    }
  })

  describe('isEncryptionAvailable', () => {
    it('returns true when AUTH_SECRET is set', () => {
      expect(isEncryptionAvailable()).toBe(true)
    })

    it('returns false when AUTH_SECRET is not set', () => {
      delete process.env.AUTH_SECRET
      expect(isEncryptionAvailable()).toBe(false)
    })
  })

  describe('encryptPassword', () => {
    it('encrypts a password successfully', async () => {
      const password = 'my-secure-password'
      const encrypted = await encryptPassword(password)

      expect(encrypted).toBeDefined()
      expect(encrypted).not.toBe(password)
      expect(encrypted.length).toBeGreaterThan(0)
    })

    it('produces different encrypted values for same password (due to random IV)', async () => {
      const password = 'same-password'
      const encrypted1 = await encryptPassword(password)
      const encrypted2 = await encryptPassword(password)

      expect(encrypted1).not.toBe(encrypted2)
    })

    it('throws EncryptionError when AUTH_SECRET is not set', async () => {
      delete process.env.AUTH_SECRET

      await expect(encryptPassword('test')).rejects.toThrow(EncryptionError)
      await expect(encryptPassword('test')).rejects.toThrow(
        'AUTH_SECRET is not set'
      )
    })

    it('handles empty string', async () => {
      const encrypted = await encryptPassword('')
      expect(encrypted).toBeDefined()
      expect(encrypted.length).toBeGreaterThan(0)
    })

    it('handles special characters', async () => {
      const password = '!@#$%^&*()_+-={}[]|:";\'<>?,./'
      const encrypted = await encryptPassword(password)
      expect(encrypted).toBeDefined()
    })

    it('handles unicode characters', async () => {
      const password = '密码🔐パスワード'
      const encrypted = await encryptPassword(password)
      expect(encrypted).toBeDefined()
    })
  })

  describe('decryptPassword', () => {
    it('decrypts an encrypted password successfully', async () => {
      const password = 'my-secure-password'
      const encrypted = await encryptPassword(password)
      const decrypted = await decryptPassword(encrypted)

      expect(decrypted).toBe(password)
    })

    it('throws EncryptionError when AUTH_SECRET is not set', async () => {
      const encrypted = await encryptPassword('test')
      delete process.env.AUTH_SECRET

      await expect(decryptPassword(encrypted)).rejects.toThrow(EncryptionError)
    })

    it('throws EncryptionError for invalid encrypted data', async () => {
      await expect(decryptPassword('invalid-base64')).rejects.toThrow(
        EncryptionError
      )
    })

    it('throws EncryptionError for too-short encrypted data', async () => {
      const shortData = Buffer.from('short').toString('base64')
      await expect(decryptPassword(shortData)).rejects.toThrow(EncryptionError)
      await expect(decryptPassword(shortData)).rejects.toThrow('too short')
    })

    it('throws EncryptionError for corrupted encrypted data', async () => {
      const password = 'test-password'
      const encrypted = await encryptPassword(password)

      // Corrupt the encrypted data
      const buffer = Buffer.from(encrypted, 'base64')
      buffer[buffer.length - 1] ^= 0xff // Flip bits in last byte
      const corrupted = buffer.toString('base64')

      await expect(decryptPassword(corrupted)).rejects.toThrow(EncryptionError)
    })

    it('handles empty string encryption and decryption', async () => {
      const encrypted = await encryptPassword('')
      const decrypted = await decryptPassword(encrypted)
      expect(decrypted).toBe('')
    })

    it('handles special characters encryption and decryption', async () => {
      const password = '!@#$%^&*()_+-={}[]|:";\'<>?,./'
      const encrypted = await encryptPassword(password)
      const decrypted = await decryptPassword(encrypted)
      expect(decrypted).toBe(password)
    })

    it('handles unicode characters encryption and decryption', async () => {
      const password = '密码🔐パスワード'
      const encrypted = await encryptPassword(password)
      const decrypted = await decryptPassword(encrypted)
      expect(decrypted).toBe(password)
    })
  })

  describe('end-to-end encryption', () => {
    it('encrypts and decrypts multiple passwords correctly', async () => {
      const passwords = [
        'password1',
        'longer-password-with-dashes',
        '123456',
        'P@ssw0rd!',
        '',
        'unicode-密码-パスワード',
      ]

      for (const password of passwords) {
        const encrypted = await encryptPassword(password)
        const decrypted = await decryptPassword(encrypted)
        expect(decrypted).toBe(password)
      }
    })

    it('fails decryption when using different AUTH_SECRET', async () => {
      const password = 'test-password'
      const encrypted = await encryptPassword(password)

      // Change AUTH_SECRET
      process.env.AUTH_SECRET = 'different-secret-key'

      await expect(decryptPassword(encrypted)).rejects.toThrow(EncryptionError)
    })
  })
})
