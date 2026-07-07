import type {
  AnnualRatePercent,
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

/** Rule Set 01 — recalculation method for lump sum part payment. */
export type LumpSumRecalculationMethod = HomeLoanPrepaymentStrategy;

export interface LumpSumSimulationRequest {
  loan: HomeLoanSnapshot;
  lumpSumAmount: MoneyAmount;
  paymentDate: IsoDate;
  method: LumpSumRecalculationMethod;
  recommendationContext?: LumpSumRecommendationContext;
}

export interface LumpSumRecommendationContext extends RecommendationContext {
  emergencyBuffer?: MoneyAmount;
  minimumEmergencyBuffer?: MoneyAmount;
  monthlyCashFlow?: MoneyAmount;
}

export interface LumpSumSimulationComparison {
  previousOutstanding: MoneyAmount;
  newOutstanding: MoneyAmount;
  previousEmi: MoneyAmount;
  newEmi: MoneyAmount;
  previousTenureMonths: TenureMonths;
  newTenureMonths: TenureMonths;
}

export interface LumpSumSimulationExplanation {
  summary: string;
  recommendation: string;
  confidence: "high" | "medium" | "low";
  suitable: boolean;
  reasons: string[];
}

export interface LumpSumSimulationResult {
  method: LumpSumRecalculationMethod;
  validation: ValidationResult;
  comparison: LumpSumSimulationComparison;
  interestSaved: MoneyAmount;
  monthsSaved: TenureMonths;
  newClosureDate: IsoDate;
  isForeclosure: boolean;
  baselineSchedule: AmortizationSchedule;
  outcomeSchedule: AmortizationSchedule;
  explanation: LumpSumSimulationExplanation;
  assumptions: string[];
}
