export { homeLoanSimulationEngine } from "@/services/home-loan-simulation/engine";
export { fromLoan, tryFromLoan, assertHomeLoan } from "@/services/home-loan-simulation/adapters/from-loan";
export {
  simulateLoanPrepayment,
  type LoanPrepaymentSimulationView,
  type LoanPrepaymentStrategy
} from "@/services/home-loan-simulation/presenters/loan-prepayment";
export {
  simulateMonthlyExtra,
  type MonthlyExtraSimulationView
} from "@/services/home-loan-simulation/presenters/monthly-extra";
export {
  simulateAnnualExtra,
  type AnnualExtraSimulationView
} from "@/services/home-loan-simulation/presenters/annual-extra";
export {
  simulateTargetClosure,
  type TargetClosureSimulationView
} from "@/services/home-loan-simulation/presenters/target-closure";
export type {
  AmortizationMonth,
  AmortizationSchedule,
  BaselineProjectionScenario,
  ComparePrepaymentScenario,
  HomeLoanCompareResult,
  HomeLoanSimulationEngine,
  HomeLoanSimulationInput,
  HomeLoanSimulationOptions,
  HomeLoanSimulationResult,
  HomeLoanSimulationScenario,
  PrepayReduceEmiScenario,
  PrepayReduceTenureScenario,
  PrepaymentRecommendationContext,
  PrepaymentStrategyRecommendation
} from "@/services/home-loan-simulation/types";
