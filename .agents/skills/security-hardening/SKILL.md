---
name: security-hardening
description: "RBAC configuration, row policies, quotas, network security, audit logging, and access control best practices."
---

# Security Hardening

## When to use this skill
Load when users ask about access control, security, auditing, or user management.

## RBAC (Role-Based Access Control)
- Create roles: `CREATE ROLE analyst`
- Grant permissions: `GRANT SELECT ON db.* TO analyst`
- Assign to users: `GRANT analyst TO user1`
- Hierarchical: roles can inherit from other roles
- Check grants: `SHOW GRANTS FOR user1`

## Row Policies
- Restrict row access per user: `CREATE ROW POLICY p ON db.table FOR SELECT USING tenant_id = currentUser()`
- Policies are AND-ed together
- Use for multi-tenant data isolation
- Check policies: `system.row_policies`

## Quotas
- Limit resource usage per user/IP: `CREATE QUOTA q FOR user1 ... LIMIT max_queries = 100`
- Quota intervals: per hour, per day, etc.
- Limits: max_queries, max_result_rows, max_read_rows, max_execution_time
- Monitor: `system.quota_usage`

## Network Security
- Restrict user access by IP: `CREATE USER u HOST IP '10.0.0.0/8'`
- Use TLS for client connections
- Inter-server encryption for replication
- Separate ports for internal vs external access

## Audit Logging
- Enable `system.session_log` for login tracking
- `system.query_log` records all queries with user info
- `system.text_log` for server-level events
- Configure log retention with TTL

## Best Practices
- Principle of least privilege — grant only needed permissions
- Use roles, not direct user grants
- Separate read-only and admin users
- Enable quotas for all non-admin users
- Regular audit of grants and access patterns
- Use `readonly = 1` setting for monitoring connections
