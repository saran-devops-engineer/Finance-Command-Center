# Session Handoff — Finance Command Center

**Purpose:** Give any new machine / new Cursor session enough context to continue without this chat history.

**Last updated:** July 2026  
**Read this first on a new laptop**, then `@docs/AI_CONTEXT.md` for product rules.

---

## Quick Start on a New Machine

```bash
git clone <your-github-repo-url>
cd Finance-Command-Center
npm install
cp .env.example .env.local   # add PostHog / Clarity keys if needed
npm run dev
```

In Cursor, start a new chat with:

> Read `@docs/SESSION_HANDOFF.md` and `@docs/AI_CONTEXT.md` before making changes.

That replaces conversation memory.

---

## What This Project Is

**Finance Command Center (FCC)** — local-first PWA for Indian users managing loans, chits, cash flow, and financial decisions.

- **Not** an expense tracker — a **Financial Decision Support System**
- **Stack:** Next.js 15, React 19, TypeScript, Tailwind, IndexedDB (`idb`), Vitest
- **Privacy:** All financial data stays on-device (IndexedDB). No backend storage in V1.

---

## Engineering Standards (Frozen)

### Standard #1 — Core Architecture

All cross-cutting infrastructure lives in `src/core/`:

```
src/core/
  analytics/       ← AnalyticsService, providers, event taxonomy
  application/     ← bootstrapApplication(), service container
  configuration/   ← env-based config
  repository/      ← FinanceRepository interface
  events/          ← finance-data events + AppEvent re-exports
  api/ backup/ error/ notifications/ providers/
```

**Rules:**
- Features call `getApplicationServices()` or `@/repositories` shims — never import PostHog/Clarity directly
- IndexedDB only through repository layer
- `fetch()` only in API provider
- Bootstrap chain: `layout.tsx` → `AppBootstrap` → `bootstrapApplication()` → `analytics.initialize()`

See `docs/ARCHITECTURE.md` and `src/core/architecture.test.ts`.

### Standard #2 — Event Taxonomy V1

**Official analytics language.** See `EVENT_TAXONOMY.md`.

- 45 frozen events in `src/core/analytics/events/`
- Always use `AppEvent.HOME_LOAN_CREATED` — never magic strings
- Screen navigation: `SCREEN_VIEWED` + `screen_name` (not `HOME_SCREEN_VIEWED`)
- Properties: snake_case, auto-attached context, **never financial values**
- Every event must answer one business question

Track via:
```typescript
import { AppEvent, trackApplicationEvent, trackScreenViewed, ScreenName } from "@/core/analytics";
```

---

## Analytics Architecture (Sprint 1 + 2)

```
Feature → AnalyticsService → CompositeAnalyticsProvider → PostHogProvider
                                                        → ClarityProvider
```

| Provider | Env var | Init |
|----------|---------|------|
| PostHog | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | `posthog-provider.ts` |
| Clarity | `NEXT_PUBLIC_CLARITY_PROJECT_ID` | `clarity-provider.ts` |

- Initialized once in `bootstrapApplication()` — **not** in React components
- Both can run simultaneously via composite provider
- Clarity failures are silent; app never breaks
- Financial UI masked with `data-clarity-mask="true"` via `PrivacyMask`, `FinancialAmount`, `MetricCard`

**Privacy masking components:**
- `src/components/ui/privacy-mask.tsx`
- `src/components/ui/financial-amount.tsx`
- `src/lib/privacy/clarity-mask.ts`

---

## Major Modules Built

### Chit Management Engine V1
- Standalone `Chit` entity — **not** modeled as a loan
- Domain: `src/shared/domain/chit.ts`
- Lifecycle: `src/services/chit-management/chit-lifecycle.ts`
- UI: `src/features/chits/*`, routes `src/app/chits/**`
- IndexedDB `chits` store (v6)

### Home Loan Engine
- `src/engines/loan/home-loan/`
- What-if simulator: `src/features/loans/what-if-simulator.tsx`

### Financial Engines
- Commitments: `src/engines/commitment/`
- Insights: `src/engines/financial-insights/`
- Snapshot: `src/services/financial-snapshot/`

---

## Key File Map

| Concern | Location |
|---------|----------|
| App bootstrap | `src/components/app-bootstrap.tsx` |
| Service container | `src/core/application/application-container.ts` |
| Event taxonomy | `src/core/analytics/events/index.ts` |
| Analytics factory | `src/core/analytics/analytics-provider-factory.ts` |
| Repository impl | `src/repositories/indexeddb-finance-repository.ts` |
| IndexedDB schema | `src/storage/indexeddb/database.ts` |
| Design tokens | `src/lib/design-tokens.ts` |
| Env example | `.env.example` |

---

## Environment Variables

```env
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_CLARITY_PROJECT_ID=
NEXT_PUBLIC_API_BASE_URL=
```

Never commit real keys. Never hardcode project IDs.

---

## Taxonomy Events — Wired vs Reserved

**Wired (examples):** `APP_OPENED`, `SCREEN_VIEWED`, `ONBOARDING_*`, loan/chit lifecycle, simulator events, money events, backup events, `PROFILE_*`, `SETTINGS_OPENED`, `ERROR_OCCURRED`

**Defined but not yet emitted** (`UNUSED_TAXONOMY_EVENTS` in `src/core/analytics/events/index.ts`):
`APP_UPDATED`, `APP_CLOSED`, `ONBOARDING_SKIPPED`, `FORECLOSURE_USED`, `THEME_CHANGED`, `ANALYTICS_CHANGED`, `FEEDBACK_SUBMITTED`

---

## UI Foundation V1.0 — FROZEN

Do **not** redesign screens unless explicitly asked. See `docs/AI_CONTEXT.md` and `CHANGELOG.md`.

New features must match existing design language (`design-tokens.ts`, handbook components).

---

## User / Agent Preferences (from recent sessions)

- **Code-only delivery preferred** — don't run `npm run dev` or tests locally unless explicitly asked
- **No git commits** unless explicitly requested
- **Minimize scope** — focused diffs, match existing conventions
- **Chits are not loans** — never model chits as loan/investment entities

---

## Verification Commands (when ready)

```bash
npm run typecheck
npm run test
npx vitest run src/core/architecture.test.ts
npx vitest run src/core/analytics/event-taxonomy.test.ts
npx vitest run src/core/analytics/clarity-provider.test.ts
npx vitest run src/core/analytics/composite-analytics-provider.test.ts
```

---

## How to Retain Context Across Machines

| Method | Transfers? | Notes |
|--------|------------|-------|
| **GitHub (code + this file)** | ✅ Yes | Best source of truth |
| **`docs/SESSION_HANDOFF.md`** | ✅ Yes | Commit & push — read on new machine |
| **`EVENT_TAXONOMY.md`** | ✅ Yes | Analytics contract |
| **`docs/AI_CONTEXT.md`** | ✅ Yes | Product + agent rules |
| **Cursor chat history** | ❌ Usually no | Tied to local machine / account sync varies |
| **Agent transcripts folder** | ❌ No | Local to old machine only |

### Recommended workflow when switching laptops

1. Push all commits to GitHub (including this file)
2. Clone on new machine
3. Sign into Cursor with same account
4. Open project, start chat: `@docs/SESSION_HANDOFF.md continue from here`
5. Optionally add `.cursor/rules/` for permanent rules (see Cursor Settings → Rules)

### Optional: Cursor Rules

Create `.cursor/rules/fcc-engineering.mdc` with pointers to this file and taxonomy rules so every new chat inherits them automatically.

---

## Recent Work Summary (July 2026)

1. **Chit Management Engine V1** — full CRUD, dashboard, insights wiring
2. **Core Architecture Foundation** — `src/core/` provider pattern, container, boundary tests
3. **PostHog Analytics Sprint 1** — provider, identity, bootstrap wiring
4. **Event Taxonomy V1** — events catalog, Engineering Standard #2, full migration
5. **Microsoft Clarity Sprint 2** — composite provider, privacy masking
6. **Domain Architecture Phase 1** — Products/Commitments navigation + product registry
7. **Domain Architecture Phase 2** — Schema V2, IncomeProfile + CommitmentRecord stores, V1→V2 migration framework, backup detect-schema + migrate-on-restore
8. **Domain Architecture Phase 3** — Onboarding redesigned: Profile → Products (optional) → Manual commitments; removed Other EMI / Insurance duplicate entry
9. **Domain Architecture Phase 4** — Product commitment generators + sync; Commitments screen with needs-review / product / manual CRUD

---

*Update this file at the end of major sessions so the next machine stays in sync.*
