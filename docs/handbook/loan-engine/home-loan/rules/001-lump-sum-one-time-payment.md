# Home Loan Rule Set 01 — Lump Sum One-Time Part Payment

Version: 1.0  
Status: Approved for implementation  
Engine path: `src/engines/loan/home-loan/simulators/lump-sum-one-time-payment.ts`

See the approved rule document for validation rules, processing flow, strategies, recommendation rules, edge cases, and test cases.

Implementation notes:

- Simulation only — never mutates stored loan data.
- UI must call `lumpSumOneTimePaymentSimulator.simulate()` — no UI-side math.
- Floating-rate loans use the latest supplied annual interest rate on the snapshot.
