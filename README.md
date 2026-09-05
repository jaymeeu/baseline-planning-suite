# Baseline Planning Suite

Three Module Federation apps: **Shell** (`:8080`), **People** (`:8081`), **Delivery** (`:8082`).

## Local development

```bash
npm install
npm run dev:people
npm run dev:delivery
npm run dev:shell
```

Shell loads remotes using `/config.js` → `window.__BPS_CONFIG__` (see `apps/shell/public/config.js` for Vite defaults).

## Docker

```bash
docker compose up --build
```

App: http://localhost:8080

### Standalone remotes (Docker)

The same People/Delivery images serve standalone SPAs and Module Federation entries:

- People: http://localhost:8081 (`remoteEntry.js` at `/remoteEntry.js`)
- Delivery: http://localhost:8082 (`remoteEntry.js` at `/remoteEntry.js`)

Smoke-check: `npm run verify:docker`

### Runtime remote URL configuration

Shell remote URLs are **not** baked into the Shell JS bundle. At container start, `envsubst` writes `/config.js` from environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `PEOPLE_REMOTE_URL` | `http://localhost:8081/remoteEntry.js` | People remote entry (browser-reachable URL) |
| `DELIVERY_REMOTE_URL` | `http://localhost:8082/remoteEntry.js` | Delivery remote entry (browser-reachable URL) |

Change a URL without rebuilding Shell:

```bash
DELIVERY_REMOTE_URL=http://127.0.0.1:8082/remoteEntry.js \
  docker compose up -d --force-recreate --no-build shell
```

Or edit the `environment` defaults in `docker-compose.yml`, then recreate Shell the same way.

Confirm: `curl http://localhost:8080/config.js`

### Remote failure demo

Shell isolates remotes with per-remote error boundaries:

- **Break People** / **Break Delivery** in the Shell nav deliberately fail one panel; the other remote and Shell chrome stay usable. **Restore** (or **Retry**) brings that panel back.
- A bad or unreachable remote entry URL fails only that panel; fix the URL and reload (or Retry after a transient failure).
- Missing or empty `window.__BPS_CONFIG__` URLs show a **Shell config error** instead of mounting a broken app.
