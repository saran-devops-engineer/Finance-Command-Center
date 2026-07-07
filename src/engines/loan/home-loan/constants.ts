/** Maximum amortization iterations to prevent runaway schedules. */
export const MAX_SCHEDULE_MONTHS = 600;

/** Minimum interest saved (INR) to treat savings as meaningful for recommendations. */
export const MEANINGFUL_INTEREST_SAVINGS_INR = 1_000;

/** Default minimum emergency buffer if caller does not supply one. */
export const DEFAULT_MINIMUM_EMERGENCY_BUFFER_INR = 0;

export const STANDARD_ASSUMPTIONS = [
  "Simulation uses the latest loan snapshot and does not modify stored loan data.",
  "Interest is calculated on reducing balance using the supplied annual rate.",
  "Monthly interest is rounded per installment before principal allocation.",
  "EMI is rounded to the nearest rupee.",
  "Floating-rate loans use the latest supplied annual interest rate."
] as const;
