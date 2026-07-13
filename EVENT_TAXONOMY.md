# FCC Event Taxonomy V1

**Engineering Standard #2** — The official analytics language of Finance Command Center.

This taxonomy is a **frozen contract**. No feature may emit analytics events outside this taxonomy. Event names must never be renamed after V1 ships.

PostHog, Microsoft Clarity, Mixpanel, Google Analytics, and future providers all consume these events through the centralized `AnalyticsService`.

---

## Naming Rules

| Rule | Value |
|------|-------|
| Format | `UPPER_CASE_WITH_UNDERSCORES` |
| Pattern | `<ENTITY>_<ACTION>` |
| Source of truth | `AppEvent` from `@/core/analytics/events` |
| Magic strings | **Forbidden** |

### Correct

```typescript
import { AppEvent, trackApplicationEvent } from "@/core/analytics";

trackApplicationEvent(AppEvent.HOME_LOAN_CREATED, { loan_id: loan.id });
trackScreenViewed(ScreenName.HOME);
```

### Forbidden

```typescript
track("Loan Created");
track("LoanCreated");
track("loan_created");
analytics.track("HOME_LOAN_CREATED"); // use AppEvent constant
```

---

## Frozen Standard Actions

These actions are frozen. New actions require **architecture review**.

`OPENED` · `VIEWED` · `CREATED` · `UPDATED` · `ARCHIVED` · `DELETED` · `STARTED` · `COMPLETED` · `USED` · `RESTORED` · `EXPORTED` · `IMPORTED` · `SUBMITTED` · `CHANGED` · `FAILED` · `ERROR_OCCURRED`

Defined in `src/core/analytics/events/standard-actions.ts`.

---

## Business Question Rule

**Every event must answer exactly one business question.**

If an event does not answer a business question, do not create it. This prevents event bloat and keeps PostHog dashboards meaningful as the product grows.

| Event | Business Question |
|-------|-------------------|
| `HOME_LOAN_CREATED` | How many users create home loans? |
| `CHIT_CREATED` | Are users adopting the Chit module? |
| `ONE_TIME_PAYMENT_USED` | Which repayment strategy is most popular? |
| `BACKUP_CREATED` | Are users protecting their data? |
| `SCREEN_VIEWED` | Which screens are most frequently visited? |
| `ONBOARDING_COMPLETED` | Are users successfully entering the app? |

Full mapping: `EVENT_BUSINESS_QUESTIONS` in `src/core/analytics/events/index.ts`.

---

## Event Categories

| Category | Events |
|----------|--------|
| **Application** | `APP_OPENED`, `APP_INSTALLED`, `APP_UPDATED`, `APP_CLOSED` |
| **Onboarding** | `ONBOARDING_STARTED`, `ONBOARDING_COMPLETED`, `ONBOARDING_SKIPPED` |
| **Screen** | `SCREEN_VIEWED` |
| **Home Loan** | `HOME_LOAN_CREATED`, `HOME_LOAN_UPDATED`, `HOME_LOAN_ARCHIVED`, `HOME_LOAN_DELETED`, `HOME_LOAN_VIEWED` |
| **Gold Loan** | `GOLD_LOAN_CREATED`, `GOLD_LOAN_UPDATED`, `GOLD_LOAN_ARCHIVED`, `GOLD_LOAN_DELETED`, `GOLD_LOAN_VIEWED` |
| **Chits** | `CHIT_CREATED`, `CHIT_UPDATED`, `CHIT_ARCHIVED`, `CHIT_DELETED`, `CHIT_VIEWED` |
| **Simulator** | `SIMULATOR_OPENED`, `ONE_TIME_PAYMENT_USED`, `MONTHLY_EXTRA_PAYMENT_USED`, `ANNUAL_EXTRA_PAYMENT_USED`, `TARGET_CLOSURE_USED`, `REDUCE_EMI_USED`, `REDUCE_TENURE_USED`, `FORECLOSURE_USED` |
| **Money** | `INCOME_UPDATED`, `EXPENSE_UPDATED`, `BUFFER_UPDATED` |
| **Backup** | `BACKUP_CREATED`, `BACKUP_RESTORED`, `EXPORT_JSON`, `IMPORT_JSON` |
| **Profile** | `PROFILE_CREATED`, `PROFILE_UPDATED` |
| **Settings** | `SETTINGS_OPENED`, `THEME_CHANGED`, `ANALYTICS_CHANGED` |
| **Feedback** | `FEEDBACK_SUBMITTED` |
| **Errors** | `ERROR_OCCURRED` |

**Total events: 45**

---

## Event Properties

### Automatically attached (never set manually in features)

| Property | Example |
|----------|---------|
| `app_version` | `"0.1.0"` |
| `platform` | `"web"` or `"installed-pwa"` |
| `browser` | `"Chrome"` |
| `operating_system` | `"Windows"` |
| `timestamp` | ISO 8601 string |
| `analytics_provider` | `"posthog"` or `"noop"` |

Applied in `buildAnalyticsContextProperties()` — `src/core/analytics/analytics-context.ts`.

### Optional (event-specific)

| Property | Used by |
|----------|---------|
| `screen_name` | `SCREEN_VIEWED` |
| `module_version` | Any screen or module |
| `loan_id` | Home/Gold loan and simulator events |
| `chit_id` | Chit events |
| `filename` | `BACKUP_CREATED` |
| `message` | `ERROR_OCCURRED` |

### Screen names (`ScreenName` constant)

`Home` · `Loans` · `Gold Loan` · `Chits` · `Profile` · `Settings` · `Money` · `Insights` · `Simulator`

Use `trackScreenViewed(ScreenName.HOME)` — never create per-screen events like `HOME_SCREEN_VIEWED`.

### Never include (PII / financial data)

Loan amount, income, expenses, EMI, outstanding balance, interest rate, gold weight, gold value, chit value, notes, or any other financial information.

---

## Directory Structure

```
src/core/analytics/events/
├── application-events.ts
├── onboarding-events.ts
├── screen-events.ts
├── loan-events.ts
├── gold-loan-events.ts
├── chit-events.ts
├── simulator-events.ts
├── money-events.ts
├── profile-events.ts
├── settings-events.ts
├── backup-events.ts
├── feedback-events.ts
├── error-events.ts
├── event-properties.ts
├── standard-actions.ts
└── index.ts          ← AppEvent, categories, business questions
```

Helpers:

- `src/core/analytics/track-application-event.ts` — typed `trackApplicationEvent()`
- `src/core/analytics/track-screen-view.ts` — `trackScreenViewed()`
- `src/core/analytics/loan-analytics-events.ts` — loan lifecycle helpers

---

## How to Track an Event

```typescript
import { AppEvent, trackApplicationEvent, trackScreenViewed, ScreenName } from "@/core/analytics";

// Screen navigation
trackScreenViewed(ScreenName.LOANS);

// Entity lifecycle
trackApplicationEvent(AppEvent.CHIT_CREATED, { chit_id: chit.id });

// No payload
trackApplicationEvent(AppEvent.ONBOARDING_COMPLETED);
```

For home/gold loans, prefer helpers in `loan-analytics-events.ts`:

```typescript
import { trackLoanCreatedEvent } from "@/core/analytics/loan-analytics-events";

trackLoanCreatedEvent(loan);
```

---

## How to Add a New Event

1. **Confirm a business question** — write it down before coding.
2. **Check if an existing event covers it** — especially `SCREEN_VIEWED` with properties.
3. **Add to the correct module file** under `src/core/analytics/events/`.
4. **Register in `index.ts`** — merge into `AppEvent`, `AppEventPayloadMap`, `EVENT_CATEGORIES`, `EVENT_BUSINESS_QUESTIONS`.
5. **Wire the emission** in the feature that answers the business question.
6. **Update this document** and `UNUSED_TAXONOMY_EVENTS` if applicable.
7. **Architecture review required** for new standard actions or new categories.

---

## When NOT to Create a New Event

- **Screen visits** → use `SCREEN_VIEWED` with `screen_name` (not `LOANS_SCREEN_VIEWED`).
- **Debug or dev-only signals** → use console logging, not analytics.
- **Financial values** → never track amounts; track the *action* (e.g. `INCOME_UPDATED`, not `INCOME_SET_TO_50000`).
- **Redundant lifecycle events** → if `HOME_LOAN_UPDATED` already covers edits, do not add `HOME_LOAN_EMI_CHANGED`.
- **No business question** → do not create the event.

---

## Unused Events (defined, not yet emitted)

These events exist in the taxonomy for future wiring:

| Event | Business Question |
|-------|-------------------|
| `APP_UPDATED` | How often do users receive app updates? |
| `APP_CLOSED` | When do users leave the app? |
| `ONBOARDING_SKIPPED` | Do users skip onboarding? |
| `FORECLOSURE_USED` | Which repayment strategy is most popular? |
| `THEME_CHANGED` | Do users customize appearance? |
| `ANALYTICS_CHANGED` | Do users control analytics preferences? |
| `FEEDBACK_SUBMITTED` | Are users sharing product feedback? |

Source: `UNUSED_TAXONOMY_EVENTS` in `src/core/analytics/events/index.ts`.

---

## Validation

Automated guard: `src/core/analytics/event-taxonomy.test.ts`

- Confirms event catalog integrity (45 events, categories, business questions).
- Forbids hardcoded event strings in `.track()` / `.capture()` calls outside the taxonomy module.

Run locally when ready:

```bash
npx vitest run src/core/analytics/event-taxonomy.test.ts
```

---

## Migration Notes (V1)

| Old | New |
|-----|-----|
| `HOME_DASHBOARD_OPENED` | `SCREEN_VIEWED` + `screen_name: "Home"` |
| `{ loanId }` payload | `{ loan_id }` payload |
| `{ chitId }` payload | `{ chit_id }` payload |
| `appVersion`, `operatingSystem` (camelCase) | `app_version`, `operating_system` (snake_case) |
| `@/core/events/app-events` | `@/core/analytics/events` (shim remains for compat) |

---

*FCC Event Taxonomy V1 — frozen. Do not rename events.*
