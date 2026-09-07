# Baseline Planning Suite

Three Module Federation React apps for baseline planning: **who** works on **what**, for **how long**, and at **what cost**.

| App | Port | Role |
|---|---|---|
| **Shell** | `8080` | Host: navigation, currency, active user, remote loading, failure isolation |
| **People** | `8081` | Employees, rates, capacity |
| **Delivery** | `8082` | Projects, WBS, staffing grid, cost using People rates |

Each remote is one codebase / one build: runs **standalone** and **hosted** in Shell.

---

## 1. Repository map

```
apps/shell/          Shell host (Module Federation runtime)
apps/people/         People remote
apps/delivery/       Delivery remote
packages/domain/     Pure domain types + calculation engine (no React)
packages/contracts/  HostContext + BroadcastChannel message types
packages/data/       IndexedDB repositories + seed loader
packages/ui/         Shared design tokens / CSS primitives
fixtures/            Baseline seed data (`seed-data.json`)
scripts/             Fixture generator, Docker verify script
docker/              Shared nginx config
docker-compose.yml   Shell :8080 · People :8081 · Delivery :8082
```

| Owner | Owns |
|---|---|
| **Shell** | Navigation, display currency, active user, runtime remote loading, remote failure isolation |
| **People** | Employees, rates, rate history, effective-dated rates, People persistence |
| **Delivery** | Projects, WBS, allocations, staffing grid, capacity/cost presentation |

- No People → Delivery imports (contracts only via `@bps/contracts`)
- People owns rates; Delivery does not duplicate rate source of truth
- Cross-remote: `BroadcastChannel('bps')` — `rates/changed` and `allocations/changed`
- Remote URLs: runtime `/config.js` → `window.__BPS_CONFIG__` (not baked into Shell JS)

---

## 2. How to run

### Docker (recommended — no Node on the host)

```bash
git clone https://github.com/jaymeeu/baseline-planning-suite.git
cd baseline-planning-suite
docker compose up
```

| URL | What you get |
|---|---|
| http://localhost:8080 | Shell host |
| http://localhost:8081 | People standalone + `/remoteEntry.js` |
| http://localhost:8082 | Delivery standalone + `/remoteEntry.js` |

`docker compose up -d` starts detached · `docker compose down` stops.

Change a remote URL **without rebuilding Shell**:

```bash
DELIVERY_REMOTE_URL=http://127.0.0.1:8082/remoteEntry.js \
  docker compose up -d --force-recreate --no-build shell
```

Confirm: `curl http://localhost:8080/config.js`

### Local development (Node.js 20+)

```bash
git clone https://github.com/jaymeeu/baseline-planning-suite.git
cd baseline-planning-suite
npm install
```

Three terminals — remotes first, then Shell:

```bash
npm run dev:people    # http://localhost:8081
npm run dev:delivery  # http://localhost:8082
npm run dev:shell     # http://localhost:8080
```

Optional: `npm test` · `npm run typecheck` · `npm run build`

---

## 3. How to break a remote on purpose

Shell keeps working when one remote fails. Run these from the **repo root** (where `docker-compose.yml` lives):

```bash
docker compose stop people
```

1. Hard-reload http://localhost:8080 → **People** panel fails; Shell + **Delivery** stay usable.
2. http://localhost:8081 is down too (service stopped).
3. Restore (again from the repo root):

```bash
docker compose start people
```

4. **Retry** in Shell (or reload) → People recovers.

Same for Delivery: `docker compose stop delivery` / `start delivery` (also from the repo root).

> **⏱️ Expect a noticeable delay (often several seconds, sometimes ~5–15s) after refresh before the failure panel appears.**
>
> That is normal. Shell still tries to load the remote’s `remoteEntry.js`. While the request is pending you see the loading skeleton; the error only shows once the browser gives up connecting to the stopped port (`:8081` / `:8082`). There is no short custom timeout in Shell — how long it takes depends on the browser’s connection timeout (and can feel slow on `localhost`).

**Alternatives**

- Shell **Resilience demo** only simulates an error panel — it does **not** stop `:8081` / `:8082`.

---

## Brief notes

- **Persistence:** IndexedDB via `@bps/data`; first load seeds from `fixtures/seed-data.json` (fixed IDs).
- **Capacity:** over-capacity is flagged, never blocked; rates mid-month split by working days.
- **Reference calc:** A. Okafor, 40h, €80 / €95 from 2026-03-12, 0.50 PM in Mar 2026 → 22 WD, 88.00 h, 50.0%, €7,880.00.
