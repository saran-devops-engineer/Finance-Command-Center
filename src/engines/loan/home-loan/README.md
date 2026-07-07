# Home Loan Amortization Engine

**Status:** Production — single source of truth for all home loan simulations  
**UI Foundation:** V1.0 frozen — UI consumes engine outputs via adapters only

## Engine entry point

```typescript
import { homeLoanAmortizationEngine } from "@/engines/loan/home-loan";
```

## Capabilities

| Method | Description |
|--------|-------------|
| `projectBaseline(snapshot)` | Full baseline amortization schedule |
| `simulateLumpSum(request)` | Lump sum with reduce-tenure or reduce-emi |
| `simulateMonthlyExtra(request)` | Recurring monthly extra payment |
| `comparePrepaymentStrategies(snapshot, amount)` | Compare both strategies + recommendation |

## Rules implemented

- Monthly rate: `r = annual / 12 / 100`
- EMI: standard reducing-balance formula
- Amortization: month-by-month until closing balance <= 0
- Interest saved: sum(original schedule interest) − sum(simulation schedule interest)
- Tenure: `ceil(ln(EMI / (EMI − P×r)) / ln(1+r))` for reduce-tenure
- Debug mode: pass `debug: true` on simulation requests

## Snapshot inputs (calculations only)

- Outstanding Principal
- Current EMI
- Interest Rate
- Remaining Tenure
- Loan Start Date
- EMI Payment Day

Original loan amount is never used in calculations.

## Legacy UI adapter

`src/services/home-loan-simulation/engine.ts` delegates to this engine for the What-If Simulator.

## Public import

```typescript
import { homeLoanAmortizationEngine } from "@/engines/loan/home-loan";
```
