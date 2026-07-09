/**
 * Home Loan Amortization Engine — canonical types.
 * Single source of truth for all home loan simulations.
 */

export interface HomeLoanSimulationSnapshot {
  loanId?: string;
  outstandingPrincipal: number;
  monthlyEmi: number;
  annualInterestRate: number;
  remainingTenureMonths: number;
  loanStartDate: string;
  emiPaymentDay: number;
  asOfDate: string;
  status?: "active" | "archived" | "deleted" | "closed";
}

export interface AmortizationScheduleRow {
  monthNumber: number;
  paymentDate: string;
  openingBalance: number;
  interest: number;
  principal: number;
  emi: number;
  extraPayment: number;
  closingBalance: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
}

export interface AmortizationSchedule {
  rows: AmortizationScheduleRow[];
  totalInterest: number;
  totalPrincipal: number;
  totalPayments: number;
  tenureMonths: number;
  closureDate: string | null;
}

export interface ScheduleComparison {
  original: AmortizationSchedule;
  simulated: AmortizationSchedule;
  interestSaved: number;
  monthsSaved: number;
  totalPaymentsDelta: number;
  closureDateDeltaMonths: number;
}

export type PrepaymentStrategy = "reduce-tenure" | "reduce-emi";

export interface LumpSumSimulationRequest {
  snapshot: HomeLoanSimulationSnapshot;
  paymentAmount: number;
  strategy: PrepaymentStrategy;
  debug?: boolean;
}

export interface MonthlyExtraSimulationRequest {
  snapshot: HomeLoanSimulationSnapshot;
  monthlyExtraAmount: number;
  strategy: PrepaymentStrategy;
  startMonthIndex?: number;
  endMonthIndex?: number;
  debug?: boolean;
}

export interface ForeclosureSimulationRequest {
  snapshot: HomeLoanSimulationSnapshot;
  settlementAmount: number;
  debug?: boolean;
}

export interface StrategyComparisonResult {
  prepaymentAmount: number;
  reduceTenure: LumpSumSimulationResult;
  reduceEmi: LumpSumSimulationResult;
  recommendation: StrategyRecommendation;
  comparison: {
    interestSavedDelta: number;
    preferredStrategy: PrepaymentStrategy;
  };
}

export interface StrategyRecommendation {
  preferredStrategy: PrepaymentStrategy;
  reason: string;
  confidence: "high" | "medium" | "low";
}

export interface LumpSumSimulationResult {
  kind: "lump-sum" | "foreclosure";
  strategy: PrepaymentStrategy;
  valid: boolean;
  errors: string[];
  warnings: string[];
  prepaymentAmount: number;
  newOutstanding: number;
  newEmi: number;
  newTenureMonths: number;
  monthsSaved: number;
  interestSaved: number;
  closureDate: string | null;
  settlementAmount?: number;
  comparison: ScheduleComparison;
  debug?: DebugReport;
}

export interface MonthlyExtraSimulationResult {
  kind: "monthly-extra";
  strategy: PrepaymentStrategy;
  valid: boolean;
  errors: string[];
  warnings: string[];
  monthlyExtraAmount: number;
  totalExtraPaid: number;
  newEmi: number;
  newTenureMonths: number;
  monthsSaved: number;
  interestSaved: number;
  closureDate: string | null;
  comparison: ScheduleComparison;
  debug?: DebugReport;
}

export interface AnnualExtraSimulationRequest {
  snapshot: HomeLoanSimulationSnapshot;
  annualExtraAmount: number;
  /** Calendar month the annual payment is made (1 = January … 12 = December). */
  paymentMonth: number;
  debug?: boolean;
}

export interface AnnualExtraSimulationResult {
  kind: "annual-extra";
  strategy: "reduce-tenure";
  valid: boolean;
  errors: string[];
  warnings: string[];
  annualExtraAmount: number;
  paymentMonth: number;
  annualPaymentsMade: number;
  totalExtraPaid: number;
  newEmi: number;
  newTenureMonths: number;
  monthsSaved: number;
  interestSaved: number;
  closureDate: string | null;
  comparison: ScheduleComparison;
  debug?: DebugReport;
}

export interface TargetClosureSimulationRequest {
  snapshot: HomeLoanSimulationSnapshot;
  /** Desired maximum remaining tenure (payments made on or before target date). */
  targetMonths: number;
  debug?: boolean;
}

export interface TargetClosureSearchStep {
  iteration: number;
  monthlyExtraTested: number;
  simulatedClosureMonths: number;
  simulatedClosureDate: string | null;
}

export interface TargetClosureSimulationResult {
  kind: "target-closure";
  strategy: "reduce-tenure";
  valid: boolean;
  errors: string[];
  warnings: string[];
  targetMonths: number;
  achievable: boolean;
  requiredMonthlyExtra: number;
  searchIterations: number;
  newEmi: number;
  interestSaved: number;
  monthsSaved: number;
  totalExtraPaid: number;
  closureDate: string | null;
  comparison: ScheduleComparison;
  searchSteps?: TargetClosureSearchStep[];
}

export interface DebugFormulaValues {
  monthlyInterestRate: number;
  emi?: number;
  tenureMonths?: number;
  newOutstanding?: number;
}

export interface DebugMonthComparison {
  monthNumber: number;
  originalInterest: number | null;
  simulatedInterest: number | null;
  originalClosingBalance: number | null;
  simulatedClosingBalance: number | null;
}

export interface DebugReport {
  formulas: DebugFormulaValues;
  originalSchedule: AmortizationSchedule;
  simulationSchedule: AmortizationSchedule;
  monthComparisons: DebugMonthComparison[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
