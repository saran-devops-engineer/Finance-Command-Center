# Product Decisions

This document records accepted decisions so future agents do not re-litigate settled scope.

## Platform

- V1 is a Progressive Web App.
- Framework: Next.js 15.
- Language: TypeScript.
- Styling: Tailwind CSS with shadcn-style reusable components.
- Icons: Lucide.
- Deployment target: GitHub to Vercel.

## Privacy

- V1 has no authentication.
- V1 has no backend.
- V1 has no cloud storage.
- User data stays on the user's device.
- IndexedDB is the local source of truth.
- Future cloud sync should synchronize local data, not replace it.

## Recommendations

- V1 does not use AI APIs.
- Recommendations are deterministic and rule-based.
- Do not label rule-based logic as real AI.
- Use "Insights" or "Recommendations" in UI copy.

## Financial Health

Financial health is not a credit score.

V1 uses simple rule-based logic:

- mandatory commitments covered by income
- available money after fixed commitments
- overdue payments
- due dates within 7 days
- debt-to-income ratio
- emergency buffer

Possible statuses:

- Healthy
- Review today
- Critical

## Available Money

Available Money =

Monthly Income
minus mandatory expenses
minus EMIs
minus loan payments
minus insurance
minus rent
minus utility bills
minus fixed commitments

This represents money safely available for savings, investments, prepayments, or discretionary spending.

## Loans

Loans should not be shown as tables.

Loan overview should use premium cards.

Active Portfolio on Home should show at most three loans:

- pinned loans first, if available
- otherwise highest-priority loans
- always include View All Loans

## Backup / Restore

V1.1 uses encrypted manual backup and restore.

Implemented direction:

- `.fcc` encrypted backup file
- password-based encryption
- IndexedDB remains the live source of truth
- backup file is only for recovery and migration
- no backend required
- no cloud account required

## Investments

V1 only needs a placeholder summary.

No investment calculations in V1.
