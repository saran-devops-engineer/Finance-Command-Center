import { STANDARD_ASSUMPTIONS } from "@/engines/loan/home-loan/constants";
import type { AmortizationCalculator } from "@/engines/loan/home-loan/calculators/AmortizationCalculator";
import type { EMICalculator } from "@/engines/loan/home-loan/calculators/EMICalculator";
import { amortizationCalculator } from "@/engines/loan/home-loan/calculators/AmortizationCalculator";
import { emiCalculator, resolveClosureDate } from "@/engines/loan/home-loan/calculators/EMICalculator";
import type {
  LumpSumSimulationComparison,
  LumpSumSimulationRequest,
  LumpSumSimulationResult
} from "@/engines/loan/home-loan/types/LumpSumRuleSet01";
import { validateLumpSumRequest } from "@/engines/loan/home-loan/validators/lump-sum-validation";
import { buildLumpSumRecommendation } from "@/engines/loan/home-loan/recommendations/lump-sum-recommendation";

export interface LumpSumOneTimePaymentSimulatorDependencies {
  emiCalculator: EMICalculator;
  amortizationCalculator: AmortizationCalculator;
}

/**
 * Rule Set 01 — Lump Sum One-Time Part Payment (simulation only).
 * Does not mutate stored loan data.
 */
export class LumpSumOneTimePaymentSimulator {
  constructor(private readonly deps: LumpSumOneTimePaymentSimulatorDependencies) {}

  simulate(request: LumpSumSimulationRequest): LumpSumSimulationResult {
    const validation = validateLumpSumRequest(request);

    if (!validation.valid) {
      return buildInvalidResult(request, validation);
    }

    const { loan, lumpSumAmount, paymentDate, method } = request;
    const asOfDate = paymentDate;
    const previousOutstanding = loan.outstandingPrincipal;
    const newOutstanding = previousOutstanding - lumpSumAmount;
    const isForeclosure = newOutstanding <= 0;
    const remainingTenure = loan.remainingTenureMonths;

    const baselineSchedule = this.deps.amortizationCalculator.buildScheduleFromParams({
      principal: previousOutstanding,
      annualInterestRate: loan.annualInterestRate,
      monthlyEmi: loan.monthlyEmi,
      asOfDate,
      installmentCount: remainingTenure
    });

    const baselineSummary = this.deps.amortizationCalculator.summarizeSchedule(baselineSchedule);

    if (isForeclosure) {
      const comparison: LumpSumSimulationComparison = {
        previousOutstanding,
        newOutstanding: 0,
        previousEmi: loan.monthlyEmi,
        newEmi: 0,
        previousTenureMonths: remainingTenure,
        newTenureMonths: 0
      };

      const explanation = buildLumpSumRecommendation({
        interestSaved: baselineSummary.totalInterestRemaining,
        monthsSaved: remainingTenure,
        isForeclosure: true,
        context: request.recommendationContext
      });

      return {
        method,
        validation,
        comparison,
        interestSaved: baselineSummary.totalInterestRemaining,
        monthsSaved: remainingTenure,
        newClosureDate: asOfDate,
        isForeclosure: true,
        baselineSchedule,
        outcomeSchedule: {
          months: [],
          totalInterestPaid: 0,
          totalPrincipalPaid: previousOutstanding,
          closureMonth: asOfDate.slice(0, 7),
          tenureMonths: 0
        },
        explanation,
        assumptions: [...STANDARD_ASSUMPTIONS]
      };
    }

    let newEmi = loan.monthlyEmi;
    let outcomeSchedule;

    if (method === "reduce-emi") {
      newEmi = this.deps.emiCalculator.calculate({
        principal: newOutstanding,
        annualInterestRate: loan.annualInterestRate,
        tenureMonths: remainingTenure,
        asOfDate
      }).monthlyEmi;

      outcomeSchedule = this.deps.amortizationCalculator.buildScheduleFromParams({
        principal: newOutstanding,
        annualInterestRate: loan.annualInterestRate,
        monthlyEmi: newEmi,
        asOfDate,
        installmentCount: remainingTenure
      });
    } else {
      const newTenureMonths = this.deps.emiCalculator.calculateTenure(
        newOutstanding,
        loan.annualInterestRate,
        loan.monthlyEmi,
        remainingTenure
      );

      outcomeSchedule = this.deps.amortizationCalculator.buildScheduleFromParams({
        principal: newOutstanding,
        annualInterestRate: loan.annualInterestRate,
        monthlyEmi: loan.monthlyEmi,
        asOfDate,
        installmentCount: newTenureMonths
      });
    }

    const outcomeSummary = this.deps.amortizationCalculator.summarizeSchedule(outcomeSchedule);
    const interestSaved = Math.max(
      baselineSummary.totalInterestRemaining - outcomeSummary.totalInterestRemaining,
      0
    );
    const monthsSaved = Math.max(baselineSummary.remainingMonths - outcomeSummary.remainingMonths, 0);
    const newClosureDate =
      outcomeSummary.estimatedClosureDate ||
      resolveClosureDate(asOfDate, outcomeSummary.remainingMonths);

    const comparison: LumpSumSimulationComparison = {
      previousOutstanding,
      newOutstanding,
      previousEmi: loan.monthlyEmi,
      newEmi,
      previousTenureMonths: remainingTenure,
      newTenureMonths: outcomeSummary.remainingMonths
    };

    const explanation = buildLumpSumRecommendation({
      interestSaved,
      monthsSaved,
      isForeclosure: false,
      context: request.recommendationContext
    });

    return {
      method,
      validation,
      comparison,
      interestSaved,
      monthsSaved,
      newClosureDate,
      isForeclosure: false,
      baselineSchedule,
      outcomeSchedule,
      explanation,
      assumptions: [...STANDARD_ASSUMPTIONS]
    };
  }
}

function buildInvalidResult(
  request: LumpSumSimulationRequest,
  validation: LumpSumSimulationResult["validation"]
): LumpSumSimulationResult {
  const { loan } = request;

  return {
    method: request.method,
    validation,
    comparison: {
      previousOutstanding: loan.outstandingPrincipal,
      newOutstanding: loan.outstandingPrincipal,
      previousEmi: loan.monthlyEmi,
      newEmi: loan.monthlyEmi,
      previousTenureMonths: loan.remainingTenureMonths,
      newTenureMonths: loan.remainingTenureMonths
    },
    interestSaved: 0,
    monthsSaved: 0,
    newClosureDate: loan.asOfDate,
    isForeclosure: false,
    baselineSchedule: {
      months: [],
      totalInterestPaid: 0,
      totalPrincipalPaid: 0,
      closureMonth: null,
      tenureMonths: 0
    },
    outcomeSchedule: {
      months: [],
      totalInterestPaid: 0,
      totalPrincipalPaid: 0,
      closureMonth: null,
      tenureMonths: 0
    },
    explanation: {
      summary: "Simulation rejected due to validation errors.",
      recommendation: "Fix inputs and retry",
      confidence: "high",
      suitable: false,
      reasons: validation.errors.map((issue) => issue.message)
    },
    assumptions: [...STANDARD_ASSUMPTIONS]
  };
}

export const lumpSumOneTimePaymentSimulator = new LumpSumOneTimePaymentSimulator({
  emiCalculator,
  amortizationCalculator
});
