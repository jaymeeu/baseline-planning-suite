# AGENTS.md — Baseline Planning Suite

Instructions for AI agents working in this repository.

## Source of truth

1. `dev-doc/innoscripta-baseline-requirements.md` — **WHAT** to build (authoritative product requirements).
2. `dev-doc/AI_IMPLEMENTATION_GUIDELINES.md` — **HOW** to implement (workflow and engineering rules).
3. This file — session consistency and decisions already taken.

Do **not** invent product requirements or expand scope beyond the case study.

When ambiguity materially affects architecture, data ownership, persistence, or cross-remote communication, stop and ask. For minor choices, pick the simplest reasonable option and document it.

---

## Agent behaviour

- Inspect before modifying.
- Prefer existing repository conventions over introducing new ones.
- Do not rewrite working infrastructure without justification.
- Do not make large changes across multiple phases without explaining the reason.
- After each meaningful phase, run the relevant tests/type checks/build.
- Fix failures before proceeding.
- Do not mark a requirement complete unless it has been implemented and verified.
- Do not use mocks, hardcoded values, or fake calculations to satisfy acceptance criteria.
- Do not silently weaken a requirement because implementation is difficult.
- Keep business logic out of UI components.
- When making an architectural decision, record it in the Decisions Log.
- When a requirement cannot be satisfied, explicitly report the reason instead of silently changing the requirement.

---

## Product in one sentence

Three independent React micro-frontends (Shell host + People remote + Delivery remote) for planning: who works on what, for how long, and at what cost.

---

## Non-negotiables

- React 18+, TypeScript `strict: true`, no `any`
- Module Federation: `shell`, `people`, `delivery`
- React and ReactDOM must be shared as singletons across Module Federation boundaries.
- Remote URLs from runtime/container config — **not** hardcoded in the JS bundle
- Each remote: one codebase, one build, works standalone **and** hosted
- `docker compose up` starts everything; app at `http://localhost:8080`
- No Node.js required on the host to run the suite
- No UI kits, headless UI, table/grid/tree packages (styling + date libs OK)
- Domain/calculation logic testable without mounting React
- One canonical allocation unit; convert only at display/edit edges
- Over-capacity is flagged, never blocked
- Parents derived from children (read-only); never silently drop allocations
- People owns rates; Delivery must not own or duplicate rate source of truth
- No direct People → Delivery imports; published contracts only

---

## Ownership

| Owner | Owns |
|---|---|
| **Shell** | Navigation, display currency, active user, runtime remote loading, remote failure isolation |
| **People** | Employees, rates, rate history, effective-dated rate logic, People persistence |
| **Delivery** | Projects, WBS, allocations, staffing grid, capacity/cost presentation using People rates |

Shell must not own People/Delivery domain logic.

---

## Domain rules (must not drift)

- Working days: Mon–Fri only; ignore weekends and public holidays
- Person-month hours = `weeklyHours × (workingDaysInMonth ÷ 5)`
- `weeklyHours` ∈ {40, 32, 20}
- Rates: `validFrom` inclusive; no end date; applies until next rate
- Mid-month rate changes: split by working-day slices, not calendar-day averages
- Pre-first-rate allocation → cost 0 + visible mark
- Capacity = 100% of one person-month for that employee/month across **all** projects
- Causing over-capacity assignment = most recently edited allocation for that employee/month
- Display precision: hours/PM/cost 2 dp; % 1 dp; round only for display; largest-remainder for totals
- Reference calculation (must pass exactly): A. Okafor, 40h, rates €80 from 2025-01-01 / €95 from 2026-03-12, 0.50 PM in March 2026 → 22 WD, 88.00 h, 50.0%, €7,880.00, blended ≈ €89.5455/h

---

## Fixture integrity

Expected fixture scale (not toys):

- 60 employees, 150 rates, 4 overlapping projects, 90 breakdown items, 12-month horizon, 720 editable cells

Preserve fixed IDs. Do not regenerate IDs on startup.

**Approved strategy:** generate a stable fixture matching these counts (no supplied fixture file was present in the repo). IDs must be fixed in source and never regenerated on seed/startup.

If a real supplied fixture is later provided, prefer it over the generated one and preserve its IDs.

---

## Architecture expectations

Separate:

- Domain (pure)
- Application / use cases
- Data access / repositories
- UI

Persistence: simplest reliable mechanism that survives reload; isolate behind data-access layer. Prefer browser persistence unless a clear reason requires a backend.

Cross-remote rate updates must use an explicit, typed contract. The implementation mechanism is a Phase 2 architectural decision and must be recorded in the Decisions Log before implementation.

---

## Implementation order (mandatory preference)

1. Inspect / plan (done before coding)
2. Domain types + pure calculation engine
3. Domain tests (especially reference calculation)
4. Data layer / persistence / repositories
5. People UI
6. Delivery UI (WBS + staffing grid)
7. Cross-remote communication
8. Shell + Module Federation
9. Runtime remote URL configuration
10. Docker Compose
11. Integration + remote failure demo
12. README + requirement audit

Do **not** polish UI before the calculation engine and tests are correct.

---

## Explicitly out of scope

Authentication, user management, notifications, scheduling, offline, mobile-specific UI, design systems, unrequested dashboards/analytics/backends, third-party UI libraries, monolithic single-app redesign, bypassing Module Federation.

---

## Verification

After implementation, verify at minimum:

- TypeScript strict check passes
- Unit/domain tests pass
- Production builds pass for all three applications
- Docker Compose starts successfully
- Shell loads both remotes
- Each remote works standalone
- Runtime remote URLs can be changed without rebuilding Shell
- Remote failure is isolated
- People rate changes update an open Delivery view without reload
- Reference calculation produces the required values

---

## Git & docs

- Meaningful commit history (logical phases, not one giant commit)
- README must cover run/Docker, structure, ownership, communication, persistence, cost calc, remote break demo, trade-offs
- Before declaring done: audit against Definition of Done in the requirements file

---

## Decisions log

Record architectural choices here as they are made (do not silently change them later).

| Decision | Choice | Rationale |
|---|---|---|
| Monorepo layout | `apps/shell`, `apps/people`, `apps/delivery` + `packages/domain`, `packages/contracts`, `packages/data` | Apps stay independently buildable; pure domain, typed contracts, and IndexedDB repos are shared without remote-to-remote imports. |
| Package manager | **npm workspaces** (`apps/*`, `packages/*`) | Already available on the host; no extra toolchain. Sufficient for three apps + shared packages. |
| Bundler | **Vite 6** | Fast local DX; production builds are simple static assets for nginx. |
| Module Federation | **`@module-federation/vite`** | Official MF runtime for Vite; shared singleton support matches the requirement. |
| Shared React | React 18.3 + ReactDOM as **shared singletons** (`requiredVersion: ^18.3.1`) | Prevents duplicate React / invalid hook calls across host and remotes. |
| TypeScript | Shared `tsconfig.base.json` with **`strict: true`**, no `any` | Case-study requirement; app configs extend the base. |
| Testing | **Vitest** at repo root | Lightweight, Vite-aligned; domain tests will stay Node/React-free. |
| Docker | Per-app multi-stage **Node build → nginx** + `docker-compose.yml` | Host needs no Node; Shell on `:8080`, remotes on `:8081`/`:8082`. |
| Dev remote URLs (Phase 1 only) | Build-time defaults via `PEOPLE_REMOTE_URL` / `DELIVERY_REMOTE_URL` in Vite config | Enough to prove federation. **Not** final: runtime injection without Shell rebuild is deferred. |
| Ports | Shell `8080`, People `8081`, Delivery `8082` | Shell matches case-study `localhost:8080`; remotes have stable local URLs. |
| Persistence | **IndexedDB** via thin adapter in `@bps/data` (no Dexie) | Survives reload; better fit than localStorage for the full fixture size; no backend required. |
| Fixture | **Generate** stable data matching stated counts (fixed IDs) in `packages/data/seeder/baseline.json` | Owns seed data with `@bps/data`; IDs never regenerated on seed/startup. |
| Canonical allocation unit | **Person-months (PM)** | One stored value; Hours / % / € convert only at display/edit edges. Unit round-trips must preserve PM. |
| Leaf with existing allocation → add child | **Move allocation onto a new child** | Never silently drop data; parent becomes derived/read-only after children exist. |
| Cross-remote transport | **Typed contract + `BroadcastChannel('bps')`** (payload schemas in `@bps/contracts`) | Explicit pub/sub; works for hosted remotes in the Shell window and across multiple Shell tabs; no People→Delivery imports. |
| Shell → remote shared context | **Host props / `HostContext`** (`currency`, `activeUser`) passed into remote `App` | Shell owns the values; remotes consume a published interface; standalone remotes supply local defaults. |
| Runtime remote URL injection | **`/config.js` → `window.__BPS_CONFIG__`** written at container start (envsubst); Shell registers remotes at runtime | Satisfies “URLs not baked into the JS bundle”; changing remote URLs does not require rebuilding Shell. |
| Styling | **Tailwind CSS v4** via `@tailwindcss/vite` in Shell, People, and Delivery | Allowed styling tooling (not a UI kit); utility classes replace hand-written `.css` files. |
| Design tokens | Shared **`@bps/ui/bps.css`** (`@theme` + primitives) | Single ledger-studio token/primitive source; apps import alongside Tailwind; no component kit. |

No further pending tooling/architecture decisions for bootstrap. Remaining work is implementation per the phased plan.


