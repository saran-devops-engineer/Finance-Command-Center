/**
 * Home Loan Engine — public API.
 *
 * Import from `@/engines/loan/home-loan` in adapters and UI boundary layers only.
 * React components must not import calculators directly.
 */

export {
  HomeLoanAmortizationEngine,
  homeLoanAmortizationEngine
} from "@/engines/loan/home-loan/HomeLoanAmortizationEngine";

export * from "@/engines/loan/home-loan/core/types";
export * from "@/engines/loan/home-loan/core/math";
export { buildBaselineSchedule, buildAmortizationSchedule } from "@/engines/loan/home-loan/core/schedule-builder";
export { simulateLumpSumPayment, simulateForeclosure } from "@/engines/loan/home-loan/simulation/lump-sum";
export { simulateMonthlyExtraPayment } from "@/engines/loan/home-loan/simulation/monthly-extra";
export { comparePrepaymentStrategies } from "@/engines/loan/home-loan/recommendation/strategy-v1";

export {
  snapshotFromPersistedLoan,
  trySnapshotFromPersistedLoan,
  snapshotFromPersistedLoan as homeLoanSnapshotFromPersistedLoan,
  trySnapshotFromPersistedLoan as tryHomeLoanSnapshotFromPersistedLoan
} from "@/engines/loan/home-loan/adapters/from-persisted-loan";

export * from "@/engines/loan/home-loan/types";
export * from "@/engines/loan/home-loan/calculators";
export * from "@/engines/loan/home-loan/simulators";
export * from "@/engines/loan/home-loan/validators";
export * from "@/engines/loan/home-loan/recommendations";
export * from "@/engines/loan/home-loan/services";
