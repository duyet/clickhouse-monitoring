import { type QueryConfig } from '@/lib/types/query-config'

export const usersConfig: QueryConfig = {
  name: 'users',
  description: 'Users account',
  sql: `
      SELECT *,
      FROM system.users
      ORDER BY name
    `,
  columns: [
    'name',
    'storage',
    'auth_type',
    'auth_params',
    'host_ip',
    'host_names',
    'default_roles_all',
    'default_roles_list',
    'default_roles_except',
    'default_database',
  ],
  columnFormats: {},
}
