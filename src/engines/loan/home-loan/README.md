# Home Loan Engine (Phase 2)

**Status:** Rule Sets 01 and 02 implemented — orchestrator facade pending  
**UI Foundation:** V1.0 frozen — screens must consume engine outputs only

## Implemented simulators

| Rule set | Entry point | Status |
|----------|-------------|--------|
| 01 — Lump sum one-time payment | `lumpSumOneTimePaymentSimulator.simulate()` | Implemented |
| 02 — Monthly extra payment | `monthlyExtraPaymentSimulator.simulate()` / `monthlyExtraPaymentService.simulate()` | Implemented |

## Pipeline

```
HomeLoanEngine (facade — pending)
  → ValidationEngine
  → EMICalculator
  → AmortizationCalculator
  → PaymentProcessor
  → SimulationEngine
  → RecommendationEngine
```

Rule-set simulators are callable directly today. The facade will delegate to them once all scenarios are approved.

## Rules

- UI must never calculate financial values.
- Every calculation must be deterministic.
- Every module must be independently testable.
- Business logic must never live inside React components.
- Banking rules are defined in `docs/handbook/loan-engine/home-loan/rules/` — do not guess formulas.

## Legacy note

`src/services/home-loan-simulation/` remains active for V1 UI until adapters wire these engines. Do not remove legacy code in this phase.

## Public entry

Import from `@/engines/loan/home-loan`.

```typescript
import {
  lumpSumOneTimePaymentSimulator,
  monthlyExtraPaymentSimulator
} from "@/engines/loan/home-loan";

// Service alias (Rule Set 02 approved naming)
import { monthlyExtraPaymentService } from "@/engines/loan/home-loan";
```
