export interface HomeLoanSimulationInput {
  loanId: string;
  outstandingBalance: number;
  annualInterestRate: number;
  monthlyEmi: number;
  remainingTenureMonths: number;
  loanStartDate?: string;
  emiPaymentDay?: number;
  asOfDate?: string;
}

export interface PrepayReduceTenureScenario {
  kind: "prepay-reduce-tenure";
  prepaymentAmount: number;
  prepaymentDate?: string;
}

export interface PrepayReduceEmiScenario {
  kind: "prepay-reduce-emi";
  prepaymentAmount: number;
  prepaymentDate?: string;
}

export interface BaselineProjectionScenario {
  kind: "baseline-projection";
}

export interface ComparePrepaymentScenario {
  kind: "compare-prepayment";
  prepaymentAmount: number;
}

export type HomeLoanSimulationScenario =
  | PrepayReduceTenureScenario
  | PrepayReduceEmiScenario
  | BaselineProjectionScenario
  | ComparePrepaymentScenario;

export interface AmortizationMonth {
  monthIndex: number;
  calendarMonth: string;
  openingBalance: number;
  interestComponent: number;
  principalComponent: number;
  emiPaid: number;
  prepaymentApplied: number;
  closingBalance: number;
}

export interface AmortizationSchedule {
  months: AmortizationMonth[];
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  closureMonth: string | null;
  tenureMonths: number;
}

export interface HomeLoanSimulationResult {
  scenario: HomeLoanSimulationScenario["kind"];
  isEstimate: true;
  input: HomeLoanSimulationInput;
  baseline: {
    remainingMonths: number;
    totalInterestRemaining: number;
    estimatedClosureDate: string;
  };
  outcome: {
    remainingMonths: number;
    revisedEmi?: number;
    monthsSaved: number;
    interestSaved: number;
    revisedOutstanding: number;
    estimatedClosureDate: string;
  };
  schedule?: AmortizationSchedule;
  assumptions: string[];
  warnings: string[];
}

export interface PrepaymentStrategyRecommendation {
  preferredStrategy: "reduce-tenure" | "reduce-emi" | "neutral";
  reason: string;
}

export interface HomeLoanCompareResult {
  prepaymentAmount: number;
  reduceTenure: HomeLoanSimulationResult;
  reduceEmi: HomeLoanSimulationResult;
  recommendation: PrepaymentStrategyRecommendation;
}

export interface HomeLoanSimulationOptions {
  includeSchedule?: boolean;
  maxScheduleMonths?: number;
}

export interface PrepaymentRecommendationContext {
  debtToIncomeRatio?: number;
  hasStrongCashBuffer?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface HomeLoanSimulationEngine {
  simulate(
    input: HomeLoanSimulationInput,
    scenario: HomeLoanSimulationScenario,
    options?: HomeLoanSimulationOptions
  ): HomeLoanSimulationResult;

  comparePrepayment(
    input: HomeLoanSimulationInput,
    prepaymentAmount: number,
    options?: HomeLoanSimulationOptions & {
      recommendationContext?: PrepaymentRecommendationContext;
    }
  ): HomeLoanCompareResult;

  projectBaseline(
    input: HomeLoanSimulationInput,
    options?: HomeLoanSimulationOptions
  ): HomeLoanSimulationResult;
}
