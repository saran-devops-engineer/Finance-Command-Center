export const MAX_SCHEDULE_MONTHS = 360;

export const DEFAULT_MAX_SCHEDULE_EXPORT_MONTHS = 360;

export const MIN_REMAINING_TENURE_MONTHS = 1;

export const MAX_REMAINING_TENURE_MONTHS = 360;

export const MAX_ANNUAL_INTEREST_RATE = 30;

export const HIGH_ANNUAL_INTEREST_RATE_THRESHOLD = 20;

export const PREPAYMENT_STRATEGY_RATE_THRESHOLD = 9;

export const HIGH_DEBT_TO_INCOME_RATIO_THRESHOLD = 0.4;

export const STANDARD_ASSUMPTIONS = [
  "Monthly EMI cycle with one payment per month.",
  "Interest is calculated on monthly reducing balance (annual rate divided by 12).",
  "Interest rate stays constant for the full projection.",
  "Reduce-EMI prepayment keeps the remaining installment count from the loan record.",
  "Reduce-tenure prepayment keeps the EMI unchanged and shortens the loan.",
  "No prepayment penalties, processing fees, or insurance are included.",
  "Tax benefits are not modeled.",
  "Figures are estimates and may differ from your lender's statement."
] as const;
