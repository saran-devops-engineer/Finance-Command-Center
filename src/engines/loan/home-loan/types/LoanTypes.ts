/**
 * Home Loan Engine — canonical type aliases and enums.
 * Banking-specific rules are defined in handbook docs, not here.
 */

/** Fixed vs floating rate classification (rules TBD). */
export type HomeLoanRateType = "fixed" | "floating" | "hybrid";

/** Prepayment strategy outcomes the engine may compare. */
export type HomeLoanPrepaymentStrategy = "reduce-tenure" | "reduce-emi" | "neutral";

/** Payment kinds the PaymentProcessor understands. */
export type HomeLoanPaymentKind = "emi" | "prepayment" | "part-payment" | "foreclosure";

/** Simulation scenario identifiers. */
export type HomeLoanSimulationKind =
  | "baseline-projection"
  | "prepay-reduce-tenure"
  | "prepay-reduce-emi"
  | "compare-prepayment";

/** Engine execution phase for observability. */
export type HomeLoanEnginePhase =
  | "validation"
  | "emi"
  | "amortization"
  | "payment"
  | "simulation"
  | "recommendation";

/** ISO calendar date (`YYYY-MM-DD`). */
export type IsoDate = string;

/** ISO timestamp. */
export type IsoTimestamp = string;

/** INR amounts in paise-free whole rupees unless banking rules specify otherwise. */
export type MoneyAmount = number;

/** Annual interest rate expressed as percent (e.g. 8.6 = 8.6% p.a.). */
export type AnnualRatePercent = number;

/** Tenure in whole months. */
export type TenureMonths = number;
