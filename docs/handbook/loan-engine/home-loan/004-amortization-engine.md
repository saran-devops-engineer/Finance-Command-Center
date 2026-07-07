# Home Loan Amortization Engine (Banking-Grade)

**Status:** Production — replaces all prior simulation math  
**Entry point:** `homeLoanAmortizationEngine` from `@/engines/loan/home-loan`

## Formulas (frozen)

### Monthly interest rate
```
r = Annual Interest Rate / 12 / 100
```

### EMI
```
EMI = P × r × (1+r)^n / ((1+r)^n − 1)
```

### Reduce tenure (after lump sum)
```
n = ln(EMI / (EMI − P×r)) / ln(1+r)   → round UP
```

## Rules

1. Every simulation starts from the **current loan snapshot** only.
2. Original loan amount is never used in calculations.
3. Every result is derived from **complete amortization schedules**.
4. Interest saved = sum(original interest) − sum(simulation interest).
5. Months saved = original tenure − simulation tenure.
6. Debug mode: pass `debug: true` on simulation requests.

## Modules

| Path | Role |
|------|------|
| `core/math.ts` | Rate, EMI, tenure formulas |
| `core/schedule-builder.ts` | Month-by-month amortization |
| `simulation/lump-sum.ts` | Lump sum + foreclosure |
| `simulation/monthly-extra.ts` | Monthly extra payment |
| `recommendation/strategy-v1.ts` | Reduce tenure vs reduce EMI |
| `HomeLoanAmortizationEngine.ts` | Public facade |
| `adapters/to-legacy-ui.ts` | What-If Simulator adapter |

## Legacy UI

`src/services/home-loan-simulation/engine.ts` is a thin adapter only — no formulas.
