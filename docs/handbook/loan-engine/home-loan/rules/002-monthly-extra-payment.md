# Finance Command Center
# Home Loan Rule Set 02
## Monthly Extra Payment
Version: 1.0

# Objective
Implement a banking-grade Monthly Extra Payment Simulation Engine.

A Monthly Extra Payment is an additional fixed amount paid every month along with the regular EMI. The extra amount is applied directly to the Outstanding Principal.

The engine must simulate the future loan and never modify the real loan.

# Scope
Supports:
- Monthly Extra Payment simulation
- Reduce Tenure (Default)
- Reduce EMI (Optional simulation)
- Interest savings
- Amortization comparison
- Recommendation generation

# Inputs
Required:
- Outstanding Principal
- Annual Interest Rate
- Current EMI
- Remaining Tenure (Months)
- Monthly Extra Payment
- Start Month
- End Month (Optional)
- Strategy
  - Reduce Tenure (Default)
  - Reduce EMI

# Validation Rules
Reject if:
- Monthly Extra Payment <= 0
- Monthly Extra Payment > Monthly Available Money
- Outstanding Principal <= 0
- Remaining Tenure <= 0
- Interest Rate <= 0
- Loan Status != Active

Warnings:
- Extra Payment > Current EMI
- Emergency Buffer falls below minimum
- Monthly Cash Flow becomes negative

# Banking Rules
1. Regular EMI is processed first.
2. Scheduled interest is calculated.
3. Principal component is deducted.
4. Monthly Extra Payment is immediately deducted from remaining Outstanding Principal.
5. Interest for the next EMI is calculated on the updated Outstanding Principal.
6. Default banking behaviour keeps EMI constant and reduces tenure.
7. Reduce EMI is supported only as an optional simulation.

# Processing Flow
Loan Snapshot
↓
Validate Inputs
↓
Generate Monthly Schedule
↓
Apply Regular EMI
↓
Apply Monthly Extra Payment
↓
Update Outstanding Principal
↓
Repeat Until Loan Closure
↓
Generate Comparison Report

# Reduce Tenure Strategy
Keep EMI constant.
Recalculate closure month.
Outputs:
- New Closure Date
- Months Saved
- Interest Saved

# Reduce EMI Strategy
Keep Remaining Tenure constant.
Recalculate EMI every month after extra payment.
Outputs:
- New EMI
- Interest Saved

# Simulation Output
Return:
- Current Loan Summary
- Simulated Loan Summary
- Interest Saved
- Months Saved
- New EMI (if applicable)
- New Closure Date
- Total Extra Paid
- Effective Annual Savings
- Recommendation
- Confidence
- Explanation

# Recommendation Rules
Recommend Monthly Extra Payment when:
- Emergency Fund remains healthy
- Monthly Cash Flow stays positive
- Interest savings are significant
- No higher-interest debt exists

Do NOT recommend if:
- User cannot maintain the payment consistently
- Emergency reserve is compromised

# Edge Cases
- Extra payment exceeds remaining principal
- Loan closes mid-month
- Floating interest changes during simulation
- User skips an extra payment (future support)
- Extra payment stops after configured end month

# Unit Tests
- ₹1,000 extra/month
- ₹5,000 extra/month
- ₹10,000 extra/month
- Zero extra payment
- Negative payment
- Extra payment greater than outstanding
- Floating-rate loan
- Fixed-rate loan
- Loan closes before end month

# Implementation

**Engine path:** `src/engines/loan/home-loan/simulators/monthly-extra-payment.ts`  
**Service alias:** `monthlyExtraPaymentService.simulate()`  
**Status:** Approved for implementation — implemented in Phase 2.

Implementation notes:

- Simulation only — never mutates stored loan data.
- UI must call `monthlyExtraPaymentSimulator.simulate()` or `monthlyExtraPaymentService.simulate()` — no UI-side math.
- `startMonth` / `endMonth` accept `YYYY-MM` calendar months; `startMonthIndex` / `endMonthIndex` are supported for engine tests.
- Default strategy is `reduce-tenure`.
- Floating-rate loans use the latest supplied annual interest rate on the snapshot.
