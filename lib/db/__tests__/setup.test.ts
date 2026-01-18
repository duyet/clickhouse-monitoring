/**
 * Database setup and integration tests
 * Tests schema initialization, adapter detection, and basic operations
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { detectDatabaseAdapter, isDatabaseConfigured } from '@/lib/auth/config'
import { getDb, resetDbInstance } from '@/lib/db'
import { generateOrgId, hasRole, slugFromName } from '@/lib/db/utils'

describe('Database Setup', () => {
  describe('Adapter Detection', () => {
    it('should detect database adapter from environment', () => {
      const adapter = detectDatabaseAdapter()
      expect(['sqlite', 'postgres', 'd1', 'libsql', 'none']).toContain(adapter)
    })

    it('should check if database is configured', () => {
      const isConfigured = isDatabaseConfigured()
      expect(typeof isConfigured).toBe('boolean')
    })
  })

  describe('Database Connection', () => {
    beforeAll(() => {
      resetDbInstance()
    })

    afterAll(() => {
      resetDbInstance()
    })

    it('should get database instance', async () => {
      if (!isDatabaseConfigured()) {
        console.log('Database not configured, skipping test')
        return
      }

      const db = await getDb()
      expect(db).toBeDefined()
    })
  })

  describe('Utilities', () => {
    it('should generate organization ID with prefix', () => {
      const id = generateOrgId()
      expect(id).toMatch(/^org_[a-f0-9]{24}$/)
    })

    it('should generate slug from name', () => {
      expect(slugFromName('My Organization')).toBe('my-organization')
      expect(slugFromName('Org With Spaces')).toBe('org-with-spaces')
      expect(slugFromName('Special@#$%')).toBe('special')
    })

    it('should validate role hierarchy', () => {
      expect(hasRole('owner', 'member')).toBe(true)
      expect(hasRole('member', 'owner')).toBe(false)
      expect(hasRole('admin', 'admin')).toBe(true)
      expect(hasRole('viewer', 'member')).toBe(false)
    })
  })
})
