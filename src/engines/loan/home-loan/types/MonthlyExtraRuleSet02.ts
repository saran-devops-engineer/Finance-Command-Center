import type {
  HomeLoanPrepaymentStrategy,
  IsoDate,
  MoneyAmount,
  TenureMonths
} from "@/engines/loan/home-loan/types/LoanTypes";
import type {
  AmortizationSchedule,
  HomeLoanSnapshot,
  RecommendationContext,
  ValidationResult
} from "@/engines/loan/home-loan/types/LoanInterfaces";

/** Rule Set 02 — recalculation method for monthly extra payment. */
export type MonthlyExtraRecalculationMethod = Extract<
  HomeLoanPrepaymentStrategy,
  "reduce-tenure" | "reduce-emi"
>;

export interface MonthlyExtraSimulationRequest {
  loan: HomeLoanSnapshot;
  monthlyExtraAmount: MoneyAmount;
  /** `YYYY-MM` calendar month when extra payments begin (preferred). */
  startMonth?: string;
  /** Inclusive `YYYY-MM` end month. Omit to apply until loan closure. */
  endMonth?: string;
  /** Zero-based month offset from `loan.asOfDate` when `startMonth` is omitted. */
  startMonthIndex?: number;
  /** Inclusive end month offset when `endMonth` is omitted. */
  endMonthIndex?: number;
  /** Defaults to `reduce-tenure`. */
  method?: MonthlyExtraRecalculationMethod;
  recommendationContext?: MonthlyExtraRecommendationContext;
}

export interface MonthlyExtraRecommendationContext extends RecommendationContext {
  emergencyBuffer?: MoneyAmount;
  minimumEmergencyBuffer?: MoneyAmount;
  monthlyCashFlow?: MoneyAmount;
  monthlyAvailableMoney?: MoneyAmount;
  hasHigherInterestDebt?: boolean;
  /** When false, recommendation defers due to sustainability concerns. */
  canMaintainConsistently?: boolean;
}

export interface MonthlyExtraLoanSummary {
  outstandingPrincipal: MoneyAmount;
  monthlyEmi: MoneyAmount;
  remainingTenureMonths: TenureMonths;
  estimatedClosureDate: IsoDate;
  totalInterestRemaining: MoneyAmount;
}

export interface MonthlyExtraSimulationComparison {
  previousOutstanding: MoneyAmount;
  newOutstanding: MoneyAmount;
  previousEmi: MoneyAmount;
  newEmi: MoneyAmount;
  previousTenureMonths: TenureMonths;
  newTenureMonths: TenureMonths;
  totalExtraPaid: MoneyAmount;
}

export interface MonthlyExtraSimulationExplanation {
  summary: string;
  recommendation: string;
  confidence: "high" | "medium" | "low";
  suitable: boolean;
  reasons: string[];
}

export interface MonthlyExtraSimulationResult {
  method: MonthlyExtraRecalculationMethod;
  validation: ValidationResult;
  currentSummary: MonthlyExtraLoanSummary;
  simulatedSummary: MonthlyExtraLoanSummary;
  comparison: MonthlyExtraSimulationComparison;
  interestSaved: MoneyAmount;
  monthsSaved: TenureMonths;
  newClosureDate: IsoDate;
  totalExtraPaid: MoneyAmount;
  effectiveAnnualSavings: MoneyAmount;
  baselineSchedule: AmortizationSchedule;
  outcomeSchedule: AmortizationSchedule;
  explanation: MonthlyExtraSimulationExplanation;
  assumptions: string[];
}
