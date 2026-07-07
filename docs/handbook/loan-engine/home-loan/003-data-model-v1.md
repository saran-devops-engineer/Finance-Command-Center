# Home Loan Data Model V1 (Frozen)

**Status:** Frozen — single source of truth for every Home Loan in the application.

## Sections

### 1. Loan Basics
- Loan Type (default: Home Loan)
- Loan Name
- Lender Name

### 2. Original Loan
- Original Loan Amount
- Loan Start Date
- Original Loan Tenure
- Interest Rate

### 3. Current Loan Snapshot
- Current Outstanding Principal
- Current EMI
- Remaining Tenure

### 4. EMI
- EMI Payment Day

## Persistence mapping

| V1 field | `Loan` property |
|----------|-----------------|
| Loan Type | `type` (`"home"`) |
| Loan Name | `name` |
| Lender Name | `lender` |
| Original Loan Amount | `originalAmount` |
| Loan Start Date | `loanStartDate` |
| Original Loan Tenure | `originalLoanTenureMonths` |
| Interest Rate | `annualInterestRate` |
| Current Outstanding Principal | `outstandingBalance` |
| Current EMI | `monthlyEmi` |
| Remaining Tenure | `remainingTenureMonths` |
| EMI Payment Day | `emiPaymentDay` |

## Derived fields (not form inputs)

- `principalPaid` — `originalAmount - outstandingBalance`
- `nextDueDate` — from `emiPaymentDay`
- `estimatedClosureDate` — from `remainingTenureMonths`
- `remainingTenureManuallyOverridden` — UX guard for auto tenure estimate

## Simulation snapshot

Engines and simulators start from:

- `outstandingBalance`
- `monthlyEmi`
- `remainingTenureMonths`
- `annualInterestRate`

Original loan fields are historical context only.

## Code entry points

- Form: `src/shared/finance/home-loan-form.ts`
- UI: `src/features/loans/home-loan-form-fields.tsx`
- Migration: `migrateLegacyHomeLoan()` + IndexedDB v3 upgrade
- Engine adapter: `src/engines/loan/home-loan/adapters/from-persisted-loan.ts`
