/**
 * ClickHouse Host repository - Data access layer for host configurations
 */

import type { ClickhouseHost, NewClickhouseHost } from '@/lib/db/schema'

import { and, eq } from 'drizzle-orm'
import { clickhouseHost } from '@/lib/db/schema'
import { generateHostId } from '@/lib/db/utils'

// Generic database type that works with both SQLite and Postgres adapters
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDatabase = any

export class ClickhouseHostRepository {
  constructor(private db: DrizzleDatabase) {}

  /**
   * Add ClickHouse host configuration
   */
  async create(data: Omit<NewClickhouseHost, 'id'>): Promise<ClickhouseHost> {
    const id = generateHostId()
    const hostData = { id, ...data } as NewClickhouseHost

    await this.db.insert(clickhouseHost).values(hostData)

    return this.getById(id) as Promise<ClickhouseHost>
  }

  /**
   * Get host by ID
   */
  async getById(id: string): Promise<ClickhouseHost | null> {
    const result = await this.db
      .select()
      .from(clickhouseHost)
      .where(eq(clickhouseHost.id, id))
      .limit(1)

    return result[0] || null
  }

  /**
   * Get all hosts for organization
   */
  async getByOrganization(
    orgId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<ClickhouseHost[]> {
    return this.db
      .select()
      .from(clickhouseHost)
      .where(eq(clickhouseHost.organizationId, orgId))
      .orderBy(clickhouseHost.sortOrder)
      .limit(limit)
      .offset(offset)
  }

  /**
   * Get active hosts for organization
   */
  async getActiveByOrganization(orgId: string): Promise<ClickhouseHost[]> {
    return this.db
      .select()
      .from(clickhouseHost)
      .where(
        and(
          eq(clickhouseHost.organizationId, orgId),
          eq(clickhouseHost.isActive, true)
        )
      )
      .orderBy(clickhouseHost.sortOrder)
  }

  /**
   * Get host by name in organization
   */
  async getByName(orgId: string, name: string): Promise<ClickhouseHost | null> {
    const result = await this.db
      .select()
      .from(clickhouseHost)
      .where(
        and(
          eq(clickhouseHost.organizationId, orgId),
          eq(clickhouseHost.name, name)
        )
      )
      .limit(1)

    return result[0] || null
  }

  /**
   * Update host configuration
   */
  async update(
    id: string,
    data: Partial<NewClickhouseHost>
  ): Promise<ClickhouseHost | null> {
    await this.db
      .update(clickhouseHost)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(clickhouseHost.id, id))

    return this.getById(id)
  }

  /**
   * Toggle host active status
   */
  async toggleActive(
    id: string,
    isActive: boolean
  ): Promise<ClickhouseHost | null> {
    return this.update(id, { isActive })
  }

  /**
   * Update sort order
   */
  async updateSortOrder(
    id: string,
    order: number
  ): Promise<ClickhouseHost | null> {
    return this.update(id, { sortOrder: order })
  }

  /**
   * Delete host
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(clickhouseHost)
      .where(eq(clickhouseHost.id, id))

    return Boolean(result)
  }

  /**
   * Delete all hosts for organization
   */
  async deleteByOrganization(orgId: string): Promise<number> {
    const result = await this.db
      .delete(clickhouseHost)
      .where(eq(clickhouseHost.organizationId, orgId))

    return result
  }

  /**
   * Count hosts in organization
   */
  async countByOrganization(orgId: string): Promise<number> {
    const result = await this.db
      .select({ count: clickhouseHost.id })
      .from(clickhouseHost)
      .where(eq(clickhouseHost.organizationId, orgId))

    return (result[0]?.count as unknown as number) || 0
  }
}
