import type {
  AnnualRatePercent,
  HomeLoanPaymentKind,
  HomeLoanPrepaymentStrategy,
  HomeLoanRateType,
  HomeLoanSimulationKind,
  IsoDate,
  MoneyAmount,
  TenureMonths
} from "@/engines/loan/home-loan/types/LoanTypes";

// ---------------------------------------------------------------------------
// Core loan snapshot (engine input — not a UI or persistence model)
// ---------------------------------------------------------------------------

export interface HomeLoanSnapshot {
  loanId: string;
  lender?: string;
  originalPrincipal: MoneyAmount;
  outstandingPrincipal: MoneyAmount;
  annualInterestRate: AnnualRatePercent;
  rateType?: HomeLoanRateType;
  monthlyEmi: MoneyAmount;
  remainingTenureMonths: TenureMonths;
  asOfDate: IsoDate;
  nextDueDate?: IsoDate;
  estimatedClosureDate?: IsoDate;
  /** Engine-only lifecycle gate. Must be `active` for simulations. */
  status?: "active" | "archived" | "deleted";
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface ValidationIssue {
  code: string;
  message: string;
  field?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface HomeLoanValidationRequest {
  loan: HomeLoanSnapshot;
  /** Optional scenario context for scenario-specific validation. */
  simulationKind?: HomeLoanSimulationKind;
  prepaymentAmount?: MoneyAmount;
}

// ---------------------------------------------------------------------------
// EMI
// ---------------------------------------------------------------------------

export interface EmiCalculationRequest {
  principal: MoneyAmount;
  annualInterestRate: AnnualRatePercent;
  tenureMonths: TenureMonths;
  asOfDate?: IsoDate;
}

export interface EmiCalculationResult {
  monthlyEmi: MoneyAmount;
  /** Human-readable assumptions applied (rules TBD). */
  assumptions: string[];
}

export interface EmiRecalculationRequest extends EmiCalculationRequest {
  revisedPrincipal: MoneyAmount;
  /** Strategy when prepayment affects EMI vs tenure (rules TBD). */
  strategy?: HomeLoanPrepaymentStrategy;
}

// ---------------------------------------------------------------------------
// Amortization
// ---------------------------------------------------------------------------

export interface AmortizationMonthRow {
  monthIndex: number;
  calendarMonth: IsoDate;
  openingBalance: MoneyAmount;
  interestComponent: MoneyAmount;
  principalComponent: MoneyAmount;
  emiPaid: MoneyAmount;
  prepaymentApplied: MoneyAmount;
  closingBalance: MoneyAmount;
}

export interface AmortizationSchedule {
  months: AmortizationMonthRow[];
  totalInterestPaid: MoneyAmount;
  totalPrincipalPaid: MoneyAmount;
  closureMonth: IsoDate | null;
  tenureMonths: TenureMonths;
}

export interface AmortizationRequest {
  loan: HomeLoanSnapshot;
  maxMonths?: TenureMonths;
  includePastPayments?: boolean;
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export interface PaymentApplicationRequest {
  loan: HomeLoanSnapshot;
  kind: HomeLoanPaymentKind;
  amount: MoneyAmount;
  principalPortion?: MoneyAmount;
  interestPortion?: MoneyAmount;
  paidOn: IsoDate;
  note?: string;
}

export interface PaymentApplicationResult {
  updatedLoan: HomeLoanSnapshot;
  paymentId: string;
  assumptions: string[];
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

export interface SimulationScenario {
  kind: HomeLoanSimulationKind;
  prepaymentAmount?: MoneyAmount;
  prepaymentDate?: IsoDate;
}

export interface SimulationOptions {
  includeSchedule?: boolean;
  maxScheduleMonths?: TenureMonths;
}

export interface SimulationOutcome {
  remainingMonths: TenureMonths;
  revisedEmi?: MoneyAmount;
  monthsSaved: TenureMonths;
  interestSaved: MoneyAmount;
  revisedOutstanding: MoneyAmount;
  estimatedClosureDate: IsoDate;
}

export interface SimulationResult {
  scenario: HomeLoanSimulationKind;
  input: HomeLoanSnapshot;
  baseline: {
    remainingMonths: TenureMonths;
    totalInterestRemaining: MoneyAmount;
    estimatedClosureDate: IsoDate;
  };
  outcome: SimulationOutcome;
  schedule?: AmortizationSchedule;
  assumptions: string[];
  warnings: string[];
}

export interface ComparePrepaymentRequest {
  loan: HomeLoanSnapshot;
  prepaymentAmount: MoneyAmount;
  options?: SimulationOptions;
}

export interface ComparePrepaymentResult {
  prepaymentAmount: MoneyAmount;
  reduceTenure: SimulationResult;
  reduceEmi: SimulationResult;
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

export interface RecommendationContext {
  debtToIncomeRatio?: number;
  hasStrongCashBuffer?: boolean;
  availableMoney?: MoneyAmount;
}

export interface HomeLoanRecommendation {
  preferredStrategy: HomeLoanPrepaymentStrategy;
  title: string;
  reason: string;
  confidence: "high" | "medium" | "low";
}

export interface RecommendationRequest {
  comparison: ComparePrepaymentResult;
  context?: RecommendationContext;
}

// ---------------------------------------------------------------------------
// Orchestrator (HomeLoanEngine)
// ---------------------------------------------------------------------------

export interface HomeLoanAnalysisRequest {
  loan: HomeLoanSnapshot;
  scenario: SimulationScenario;
  options?: SimulationOptions;
  recommendationContext?: RecommendationContext;
}

export interface HomeLoanAnalysisResult {
  validation: ValidationResult;
  emi?: EmiCalculationResult;
  schedule?: AmortizationSchedule;
  simulation: SimulationResult;
  recommendation?: HomeLoanRecommendation;
  processedAt: IsoDate;
}
