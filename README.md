# Baseline Planning Suite

Three Module Federation React apps for baseline planning: **who** works on **what**, for **how long**, and at **what cost**.

| App | Port | Role |
|---|---|---|
| **Shell** | `8080` | Host: navigation, display currency, active user, remote loading, failure isolation |
| **People** | `8081` | Employees, rates, rate history, capacity view |
| **Delivery** | `8082` | Projects, WBS, staffing grid, cost presentation using People rates |

Each remote is one codebase and one build: it runs **standalone** and **hosted** in Shell.

## Repository structure

```
apps/shell/          Shell host (Module Federation runtime)
apps/people/         People remote
apps/delivery/       Delivery remote
packages/domain/     Pure domain types + calculation engine (no React)
packages/contracts/  Shared HostContext + BroadcastChannel message types
packages/data/       IndexedDB repositories + baseline seed
fixtures/            Stable baseline.json (fixed IDs)
scripts/             Fixture generator, Docker verify script
```

## Architecture and ownership

| Owner | Owns |
|---|---|
| **Shell** | Navigation, display currency, active user, runtime remote loading, remote failure isolation |
| **People** | Employees, rates, rate history, effective-dated rate logic, People persistence |
| **Delivery** | Projects, WBS, allocations, staffing grid, capacity/cost presentation using People rates |

- Shell must not own People/Delivery domain logic.
- People owns rates; Delivery must not duplicate rate source of truth.
- **No direct People → Delivery imports** — published contracts only (`@bps/contracts`).
- Domain and calculation logic live in `@bps/domain` and are testable without mounting React.

### Microfrontend boundaries

- **Bundler:** Vite 6 + `@module-federation/vite`
- **Shared singletons:** React 18.3 and ReactDOM (`requiredVersion: ^18.3.1`)
- **Shell → remotes:** `HostContext` props (`currency`, `activeUser`); standalone remotes supply local defaults
- **People → Delivery rates:** typed `rates/changed` messages on `BroadcastChannel('bps')`
- **Remote URLs:** runtime `/config.js` → `window.__BPS_CONFIG__` (not baked into the Shell JS bundle)

## Installation

Requires Node.js 20+ for local development. Docker Compose needs no Node on the host to *run* the suite.

```bash
npm install
```

## Local development

Start remotes first, then Shell:

```bash
npm run dev:people    # http://localhost:8081
npm run dev:delivery  # http://localhost:8082
npm run dev:shell     # http://localhost:8080
```

Shell loads remotes using `/config.js` → `window.__BPS_CONFIG__` (see `apps/shell/public/config.js` for Vite defaults).

### Standalone remotes (local)

- People: http://localhost:8081
- Delivery: http://localhost:8082

Same apps and builds as when hosted under Shell.

## Docker

```bash
docker compose up --build
```

App: http://localhost:8080

No Node.js is required on the host to run the containers (multi-stage Node build → nginx).

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

- Open **Resilience demo** in the Shell header (secondary disclosure — not primary nav). **Break People** / **Break Delivery** fail one panel; the other remote and Shell chrome stay usable. **Restore** (or **Retry**) brings that panel back.
- A bad or unreachable remote entry URL fails only that panel; fix the URL and reload (or Retry after a transient failure).
- Missing or empty `window.__BPS_CONFIG__` URLs show a **Shell config error** alert instead of mounting a broken app.

## Persistence

- Browser **IndexedDB** behind repositories in `@bps/data` (no backend).
- On first load, empty databases are seeded from `fixtures/baseline.json` (fixed IDs; not regenerated on startup).
- Data survives page refresh **on the same origin**.
- **Origin caveat:** IndexedDB is keyed by scheme + host + **port**. Shell at `localhost:8080` stores suite data used by hosted remotes. Opening People at `:8081` or Delivery at `:8082` standalone uses **separate** databases (they seed independently). That is browser security, not a sync bug.
- Clear site data for the origin you are testing if you need to re-seed after fixture changes.

## Cost and capacity (brief)

- **Canonical unit:** person-months (PM). Hours / % / € convert only at display/edit edges; round-trips preserve stored PM.
- **Working days:** Mon–Fri only. Mid-month rate changes split by working-day slices.
- **Rates:** `validFrom` inclusive; applies until the next rate. Pre-first-rate allocations cost `0` and are visibly marked.
- **Capacity:** 100% of one person-month across **all** projects; over-capacity is **flagged, never blocked**. Causing assignment = most recently edited allocation for that employee/month.
- **Reference:** A. Okafor, 40h, €80 from 2025-01-01 / €95 from 2026-03-12, 0.50 PM in March 2026 → 22 WD, 88.00 h, 50.0%, €7,880.00, blended ≈ €89.5455/h.

## Tests and quality gates

```bash
npm test                 # Vitest (domain + data + contracts + apps helpers)
npm run typecheck        # TypeScript strict across workspaces
npm run build            # Production builds for people, delivery, shell
npm run verify:docker    # HTTP smoke against compose stack (:8080/:8081/:8082)
```

Domain tests do not mount React. Fixture scale: 60 employees, 150 rates, 4 projects, 90 WBS items, 720 allocations.

## Architecture decisions

| Decision | Choice | Rationale |
|---|---|---|
| Monorepo | `apps/*` + `packages/domain`, `contracts`, `data` | Independently buildable apps; shared pure domain without remote-to-remote imports |
| Package manager | npm workspaces | No extra toolchain |
| Bundler | Vite 6 | Fast DX; static nginx assets |
| Module Federation | `@module-federation/vite` | Shared React singletons across host/remotes |
| Canonical allocation unit | Person-months (PM) | One stored value; convert at edges only |
| Persistence | IndexedDB via `@bps/data` | Survives reload; no backend |
| Fixture | Generated `fixtures/baseline.json` with fixed IDs | Matches case-study counts; IDs never regenerated on seed |
| Leaf + allocation → add child | Move allocations onto the new child | Never silently drop data; parent becomes derived |
| Cross-remote rates | `BroadcastChannel('bps')` + `@bps/contracts` | Explicit typed pub/sub; no People→Delivery imports |
| Shell shared context | `HostContext` props | Shell owns currency / active user |
| Runtime remote URLs | `/config.js` → `window.__BPS_CONFIG__` (envsubst) | Change URLs without rebuilding Shell |
| Styling | Tailwind CSS v4 + shared `@bps/ui` tokens | Allowed styling tooling (not a UI kit) |

## UI notes

Presentation polish uses a shared “ledger studio” layer — cool paper, ink type, one green signal — so Shell, People, and Delivery read as one product. **No UI kits**, headless UI, or table/grid packages (case-study rule). Business rules stay in `@bps/domain` / hooks; components only present and edit.

| Concern | Choice |
|---|---|
| Tokens | `@bps/ui` → `packages/ui/bps.css` (`@theme` + primitives: panel, button, field, badge, alert, grid) |
| Color | Ink `#1A2332`, slate, paper `#F3F5F7`, surface, line, signal `#0F6E56`; danger/warn derived for over-capacity and no-rate |
| Fonts | **Fraunces** (titles), **Source Sans 3** (UI), **IBM Plex Mono** (grid/rates) — loaded in each app `index.html` |
| Apps | Import `@import "@bps/ui/bps.css"` alongside Tailwind |

Optional static token preview: open `design-system-preview.html` in a browser (not part of the runtime apps).

### Visual QA checklist (before demos)

**Shell (`:8080`)**

- [ ] Product name uses display type; currency / active user sit quietly in the header
- [ ] People / Delivery nav tabs; selected tab shows signal underline
- [ ] Resilience demo is under a disclosure, not equal to primary nav
- [ ] Break People / Break Delivery isolates failure; Retry remounts; other remote still works
- [ ] Loading remote shows skeleton (respects reduced motion)

**People (`:8081` or Shell → People)**

- [ ] Employee search filters the register; selected row uses signal tint
- [ ] Oversubscribed badge when capacity > 100% in any month
- [ ] Detail / rates Save is primary; capacity meters show over in danger styling
- [ ] Empty selection and load-error copy say what to do next

**Delivery (`:8082` or Shell → Delivery)**

- [ ] Project list + WBS: depth indent, leaf / derived-parent badges, quiet actions
- [ ] Staffing grid: sticky employee column + month headers; unit switcher is segmented (PM / Hours / % / €)
- [ ] Leaf cells editable; parent cells read-only; over-capacity tint; `*` for no applicable rate (Cost)
- [ ] Over-capacity never blocks save; row/column totals readable
- [ ] Status / cell-error banners use Alert + Dismiss
- [ ] Narrow viewport: side panels stack; grid shows horizontal-scroll cue

**Cross-cutting**

- [ ] Same paper / ink / signal language in all three surfaces
- [ ] Keyboard: Tab through lists and grid inputs; focus ring visible (signal)
- [ ] Change a rate in People → open Delivery staffing (Cost) updates without full page reload

## Trade-offs and known limitations

- **BroadcastChannel** delivers rate updates within the same browser origin (Shell tabs / mounted remotes). It is not a multi-device sync bus.
- **IndexedDB** is browser-local and **origin-scoped** (port matters: `:8080` ≠ `:8081` ≠ `:8082`); there is no server API or multi-user conflict resolution. Hosted remotes share Shell’s origin; standalone remotes do not share Shell’s data.
- **Fixture** is generated to match required counts (no externally supplied dump was present); prefer a real supplied fixture later if one appears, preserving its IDs.
- **Module Federation DTS** may log type-declaration warnings during Docker builds; production assets still build and serve.
- Auth, notifications, offline, mobile-specific UI, and third-party UI kits are **out of scope** for the case study.
