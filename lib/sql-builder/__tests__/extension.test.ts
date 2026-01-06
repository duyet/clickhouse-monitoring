/**
 * Extension System Tests
 *
 * Tests for version-aware query extensions and modifications.
 */

import { sql } from '../builder'
import { SqlBuilderError } from '../validator'

describe('ExtendedBuilder', () => {
  describe('Column Modifications', () => {
    it('should add columns to query', () => {
      const base = sql().select('id', 'name').from('users')

      const extended = base.extend().addColumn('email').addColumn('created_at')

      const query = extended.build()
      expect(query).toContain('id, name, email, created_at')
    })

    it('should add column after specific column', () => {
      const base = sql().select('id', 'name', 'status').from('users')

      const extended = base.extend().addColumn('email', { after: 'name' })

      const query = extended.build()
      // Email should be between name and status
      expect(query).toMatch(/name.*email.*status/)
    })

    it('should remove columns from query', () => {
      const base = sql().select('id', 'name', 'email', 'phone').from('users')

      const extended = base.extend().removeColumn('email').removeColumn('phone')

      const query = extended.build()
      expect(query).toContain('id, name')
      expect(query).not.toContain('email')
      expect(query).not.toContain('phone')
    })

    it('should replace columns', () => {
      const base = sql().select('id', 'old_name', 'email').from('users')

      const extended = base.extend().replaceColumn('old_name', 'new_name')

      const query = extended.build()
      expect(query).toContain('new_name')
      expect(query).not.toContain('old_name')
    })
  })

  describe('WHERE Modifications', () => {
    it('should add WHERE conditions', () => {
      const base = sql()
        .select('*')
        .from('users')
        .where('status', '=', 'active')

      const extended = base
        .extend()
        .addWhere('age', '>', 18)
        .addWhere('verified', '=', true)

      const query = extended.build()
      expect(query).toContain('status = ')
      expect(query).toContain('age > ')
      expect(query).toContain('verified = ')
    })

    it('should remove WHERE conditions', () => {
      const base = sql()
        .select('*')
        .from('users')
        .where('status', '=', 'active')
        .where('is_deleted', '=', 0)

      const extended = base.extend().removeWhere('is_deleted', '=', 0)

      const query = extended.build()
      expect(query).toContain('status = ')
      expect(query).not.toContain('is_deleted')
    })
  })

  describe('ORDER BY Modifications', () => {
    it('should change ORDER BY direction', () => {
      const base = sql().select('*').from('users').orderBy('created_at', 'ASC')

      const extended = base.extend().changeOrderBy('created_at', 'DESC')

      const query = extended.build()
      expect(query).toContain('created_at DESC')
      expect(query).not.toContain('created_at ASC')
    })

    it('should add new ORDER BY clauses', () => {
      const base = sql().select('*').from('users').orderBy('name')

      const extended = base.extend().addOrderBy('created_at', 'DESC')

      const query = extended.build()
      expect(query).toContain('ORDER BY')
      expect(query).toContain('name')
      expect(query).toContain('created_at DESC')
    })

    it('should remove ORDER BY clauses', () => {
      const base = sql()
        .select('*')
        .from('users')
        .orderBy('name')
        .orderBy('created_at', 'DESC')

      const extended = base.extend().removeOrderBy('name')

      const query = extended.build()
      expect(query).toContain('ORDER BY created_at DESC')
      expect(query).not.toMatch(/ORDER BY.*name/)
    })
  })

  describe('JOIN Modifications', () => {
    it('should add INNER JOINs', () => {
      const base = sql().select('*').from('users', 'u')

      const extended = base.extend().addJoin('orders', 'o', 'o.user_id = u.id')

      const query = extended.build()
      expect(query).toContain('INNER JOIN orders AS o ON o.user_id = u.id')
    })

    it('should add LEFT JOINs', () => {
      const base = sql().select('*').from('users', 'u')

      const extended = base
        .extend()
        .addLeftJoin('profiles', 'p', 'p.user_id = u.id')

      const query = extended.build()
      expect(query).toContain('LEFT JOIN profiles AS p ON p.user_id = u.id')
    })

    it('should add JOIN with USING clause', () => {
      const base = sql().select('*').from('users', 'u')

      const extended = base
        .extend()
        .addJoin('profiles', 'p', { using: ['user_id'] })

      const query = extended.build()
      expect(query).toContain('INNER JOIN profiles AS p USING (user_id)')
    })

    it('should remove JOINs by alias', () => {
      const base = sql()
        .select('*')
        .from('users', 'u')
        .leftJoin('profiles', 'p', 'p.user_id = u.id')
        .leftJoin('orders', 'o', 'o.user_id = u.id')

      const extended = base.extend().removeJoin('p')

      const query = extended.build()
      expect(query).toContain('orders')
      expect(query).not.toContain('profiles')
    })
  })

  describe('Extension Chaining', () => {
    it('should support unlimited extension depth', () => {
      // v23: Base query
      const v23 = sql()
        .select('id', 'name')
        .from('users')
        .where('status', '=', 'active')

      // v24: Add column
      const v24 = v23.extend().addColumn('email')

      // v25: Add another column and filter
      const v25 = v24
        .extend()
        .addColumn('phone')
        .addWhere('verified', '=', true)

      // v26: Change ordering
      const v26 = v25.extend().changeOrderBy('created_at', 'DESC')

      const query = v26.build()
      expect(query).toContain('id, name, email, phone')
      expect(query).toContain('status = ')
      expect(query).toContain('verified = ')
      expect(query).toContain('ORDER BY created_at DESC')
    })

    it('should allow branching extensions', () => {
      const base = sql().select('id', 'name').from('users')

      // Branch A: Add email
      const branchA = base.extend().addColumn('email')

      // Branch B: Add phone
      const branchB = base.extend().addColumn('phone')

      const queryA = branchA.build()
      const queryB = branchB.build()

      expect(queryA).toContain('email')
      expect(queryA).not.toContain('phone')

      expect(queryB).toContain('phone')
      expect(queryB).not.toContain('email')
    })
  })

  describe('Immutability', () => {
    it('should not modify base builder', () => {
      const base = sql().select('id', 'name').from('users')

      const baseQuery = base.build()

      // Create extension and modify
      base.extend().addColumn('email').addWhere('status', '=', 'active')

      // Base should be unchanged
      const baseQueryAfter = base.build()
      expect(baseQuery).toBe(baseQueryAfter)
    })

    it('should not modify parent extension', () => {
      const base = sql().select('id', 'name').from('users')

      const ext1 = base.extend().addColumn('email')
      const ext1Query = ext1.build()

      // Create child extension
      ext1.extend().addColumn('phone')

      // Parent extension should be unchanged
      const ext1QueryAfter = ext1.build()
      expect(ext1Query).toBe(ext1QueryAfter)
      expect(ext1Query).not.toContain('phone')
    })
  })

  describe('Version-Aware Query Example', () => {
    it('should demonstrate ClickHouse version extension pattern', () => {
      // Base query for ClickHouse 23.8
      const v23_8 = sql()
        .select('query', 'user', 'memory_usage', 'elapsed')
        .from('system.processes')
        .where('is_cancelled', '=', 0)
        .orderBy('elapsed', 'DESC')

      // ClickHouse 24.1 added peak_threads_usage column
      const v24_1 = v23_8.extend().addColumn('peak_threads_usage')

      // ClickHouse 24.3 added query_cache_usage column
      const v24_3 = v24_1.extend().addColumn('query_cache_usage')

      // ClickHouse 25.1: Remove old ordering and set new one
      const v25_1 = v24_3
        .extend()
        .removeOrderBy('elapsed')
        .addOrderBy('memory_usage', 'DESC')

      // Test v23.8 query
      const q23_8 = v23_8.build()
      expect(q23_8).toContain('query, user, memory_usage, elapsed')
      expect(q23_8).not.toContain('peak_threads_usage')
      expect(q23_8).toContain('ORDER BY elapsed DESC')

      // Test v24.1 query
      const q24_1 = v24_1.build()
      expect(q24_1).toContain('peak_threads_usage')
      expect(q24_1).not.toContain('query_cache_usage')
      expect(q24_1).toContain('ORDER BY elapsed DESC')

      // Test v24.3 query
      const q24_3 = v24_3.build()
      expect(q24_3).toContain('peak_threads_usage')
      expect(q24_3).toContain('query_cache_usage')
      expect(q24_3).toContain('ORDER BY elapsed DESC')

      // Test v25.1 query
      const q25_1 = v25_1.build()
      expect(q25_1).toContain('peak_threads_usage')
      expect(q25_1).toContain('query_cache_usage')
      expect(q25_1).toContain('ORDER BY memory_usage DESC')
      expect(q25_1).not.toContain('elapsed DESC')
    })
  })

  describe('Build and Validation', () => {
    it('should validate extended query before building', () => {
      const base = sql().select('id').from('users')

      // Remove all columns - should fail validation
      const extended = base.extend().removeColumn('id')

      expect(() => extended.build()).toThrow(SqlBuilderError)
      expect(() => extended.build()).toThrow('Cannot build SQL without columns')
    })

    it('should support buildPretty', () => {
      const base = sql().select('id', 'name').from('users')

      const extended = base
        .extend()
        .addColumn('email')
        .addWhere('status', '=', 'active')

      const pretty = extended.buildPretty()
      expect(pretty).toContain('\n')
      expect(pretty).toContain('SELECT')
      expect(pretty).toContain('FROM')
      expect(pretty).toContain('WHERE')
    })
  })

  describe('Complex Modifications', () => {
    it('should handle multiple modifications of same type', () => {
      const base = sql().select('id').from('users')

      const extended = base
        .extend()
        .addColumn('name')
        .addColumn('email')
        .addColumn('phone')
        .addWhere('status', '=', 'active')
        .addWhere('verified', '=', true)
        .addWhere('age', '>', 18)
        .addOrderBy('created_at', 'DESC')
        .addOrderBy('name', 'ASC')

      const query = extended.build()
      expect(query).toContain('id, name, email, phone')
      expect(query).toContain('status = ')
      expect(query).toContain('verified = ')
      expect(query).toContain('age > ')
      expect(query).toContain('ORDER BY')
    })

    it('should apply modifications in correct order', () => {
      const base = sql().select('id', 'old_name', 'email').from('users')

      const extended = base
        .extend()
        .replaceColumn('old_name', 'new_name') // Replace first
        .addColumn('phone') // Then add

      const query = extended.build()
      expect(query).toContain('new_name')
      expect(query).not.toContain('old_name')
      expect(query).toContain('phone')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty modifications', () => {
      const base = sql().select('id').from('users')

      const extended = base.extend()

      const baseQuery = base.build()
      const extendedQuery = extended.build()

      expect(extendedQuery).toBe(baseQuery)
    })

    it('should handle removeColumn on non-existent column', () => {
      const base = sql().select('id', 'name').from('users')

      const extended = base.extend().removeColumn('non_existent')

      const query = extended.build()
      expect(query).toContain('id, name')
    })

    it('should handle removeWhere on non-existent condition', () => {
      const base = sql()
        .select('*')
        .from('users')
        .where('status', '=', 'active')

      const extended = base.extend().removeWhere('non_existent', '=', 'value')

      const query = extended.build()
      expect(query).toContain('status = ')
    })

    it('should handle addOrderBy for duplicate column', () => {
      const base = sql().select('*').from('users').orderBy('name', 'ASC')

      const extended = base.extend().addOrderBy('name', 'DESC')

      const query = extended.build()
      // Should not add duplicate, keep original
      expect(query).toContain('ORDER BY name ASC')
    })
  })
})
