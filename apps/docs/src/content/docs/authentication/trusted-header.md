---
title: "Reverse proxy: trusted header"
editUrl: "https://github.com/duyet/clickhouse-monitoring/edit/main/docs/content/authentication/trusted-header.mdx"
---

Use this when you front chmonitor with a proxy that does its own authentication — nginx with an SSO module, a Kubernetes ingress with auth-url, or similar. The proxy sets a header with the authenticated user's identity; chmonitor trusts it only when a shared secret is also present.

## How it works

- The upstream proxy authenticates the user and sets a header with their identity (e.g. `X-Forwarded-User: alice@example.com`).
- The proxy also sets a shared-secret header on every request.
- chmonitor checks the secret in constant time. If it matches, the identity header is trusted and the user is authenticated.
- **Without `CHM_PROXY_AUTH_SECRET` set, this mechanism is disabled.** Any request missing the correct secret is treated as unauthenticated regardless of the identity header.

This prevents header forgery: a direct client hitting the Worker URL cannot fake authentication because they don't know the secret.

## Configuration

```bash
CHM_AUTH_PROVIDER=proxy
CHM_PROXY_AUTH_HEADER=X-Forwarded-User          # identity header (default)
CHM_PROXY_SHARED_SECRET_HEADER=X-Chm-Proxy-Secret  # secret header (default)
```

Set the secret out-of-band — never as a plaintext env file:

```bash
wrangler secret put CHM_PROXY_AUTH_SECRET
```

## nginx example

```nginx
location / {
  # Your auth_request / SSO module sets $authenticated_user
  auth_request /auth;
  auth_request_set $authenticated_user $upstream_http_x_auth_user;

  proxy_set_header X-Forwarded-User    $authenticated_user;
  proxy_set_header X-Chm-Proxy-Secret  "the-same-long-random-secret";
  proxy_pass http://chmonitor_upstream;
}
```

The value of `X-Chm-Proxy-Secret` must match the `CHM_PROXY_AUTH_SECRET` you configured on the server.

> **Production note:** do not hardcode the secret value in your nginx config files. Load it at deploy time using environment variable substitution (`envsubst`), a secrets manager (e.g., HashiCorp Vault Agent), or a configuration management tool, and exclude the config from source control.

## Kubernetes ingress example

For k8s ingress with an external auth service, add the secret header in your ingress annotation or auth proxy config:

```yaml
nginx.ingress.kubernetes.io/configuration-snippet: |
  proxy_set_header X-Forwarded-User $http_x_auth_request_user;
  proxy_set_header X-Chm-Proxy-Secret "the-same-long-random-secret";
```

> **Production note:** store the secret in a Kubernetes Secret and inject it into your auth proxy or ingress config at runtime rather than hardcoding it in YAML manifests that may be committed to source control. Example: `kubectl create secret generic chm-proxy-secret --from-literal=value=<secret>`, then reference it as an environment variable in your proxy container.

## Notes

- Use different header names if your proxy already uses `X-Forwarded-User` for something else. Set `CHM_PROXY_AUTH_HEADER` to your custom header name.
- Cloudflare Access (`CHM_CF_ACCESS_*`) can also be configured under `CHM_AUTH_PROVIDER=proxy`. Both mechanisms are checked independently; Access is checked first. See [Cloudflare Access](/authentication/cloudflare-access).
- Combine with `CHM_API_KEY_SECRET` to allow MCP/script access via `chm_` tokens. See [API keys](/authentication/api-keys).

## Related

- [Authentication overview](/authentication)
- [Cloudflare Access](/authentication/cloudflare-access)
- [API keys](/authentication/api-keys)
- [Environment Variables — Authentication](/reference/environment-variables#authentication)
- [Feature Permissions](/advanced/feature-permissions)
