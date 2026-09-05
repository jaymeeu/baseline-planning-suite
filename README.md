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

### Runtime remote URL configuration

Shell remote URLs are **not** baked into the Shell JS bundle. At container start, `envsubst` writes `/config.js` from environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `PEOPLE_REMOTE_URL` | `http://localhost:8081/remoteEntry.js` | People remote entry (browser-reachable URL) |
| `DELIVERY_REMOTE_URL` | `http://localhost:8082/remoteEntry.js` | Delivery remote entry (browser-reachable URL) |

Change a URL without rebuilding Shell:

1. Edit the `environment` block for `shell` in `docker-compose.yml` (or pass `-e`).
2. Recreate only the Shell container:

```bash
docker compose up -d --force-recreate --no-build shell
```

3. Confirm: `curl http://localhost:8080/config.js`
