import { MAX_SCHEDULE_MONTHS, STANDARD_ASSUMPTIONS } from "@/engines/loan/home-loan/constants";
import type { AmortizationCalculator } from "@/engines/loan/home-loan/calculators/AmortizationCalculator";
import { amortizationCalculator } from "@/engines/loan/home-loan/calculators/AmortizationCalculator";
import { computeEmi, resolveClosureDate } from "@/engines/loan/home-loan/calculators/EMICalculator";
import type {
  AmortizationSchedule,
  HomeLoanSnapshot
} from "@/engines/loan/home-loan/types/LoanInterfaces";
import type {
  MonthlyExtraLoanSummary,
  MonthlyExtraSimulationComparison,
  MonthlyExtraSimulationRequest,
  MonthlyExtraSimulationResult
} from "@/engines/loan/home-loan/types/MonthlyExtraRuleSet02";
import { validateMonthlyExtraRequest, resolveRequestMonthWindow } from "@/engines/loan/home-loan/validators/monthly-extra-validation";
import { buildMonthlyExtraRecommendation } from "@/engines/loan/home-loan/recommendations/monthly-extra-recommendation";
import { formatCalendarMonth } from "@/engines/loan/home-loan/utils/dates";
import { roundInterest, roundMoney } from "@/engines/loan/home-loan/utils/money";
import { calculateMonthlyRate } from "@/engines/loan/home-loan/utils/rates";

export interface MonthlyExtraPaymentSimulatorDependencies {
  amortizationCalculator: AmortizationCalculator;
}

/**
 * Rule Set 02 — Monthly Extra Payment (simulation only).
 * Does not mutate stored loan data.
 */
export class MonthlyExtraPaymentSimulator {
  constructor(private readonly deps: MonthlyExtraPaymentSimulatorDependencies) {}

  simulate(request: MonthlyExtraSimulationRequest): MonthlyExtraSimulationResult {
    const validation = validateMonthlyExtraRequest(request);

    if (!validation.valid) {
      return buildInvalidResult(request, validation);
    }

    const method = request.method ?? "reduce-tenure";
    const { loan, monthlyExtraAmount } = request;
    const { startMonthIndex, endMonthIndex } = resolveRequestMonthWindow(request);
    const asOfDate = loan.asOfDate;
    const prepaymentByMonth = buildPrepaymentMap(
      startMonthIndex,
      endMonthIndex,
      monthlyExtraAmount
    );

    const baselineSchedule = this.deps.amortizationCalculator.buildScheduleFromParams({
      principal: loan.outstandingPrincipal,
      annualInterestRate: loan.annualInterestRate,
      monthlyEmi: loan.monthlyEmi,
      asOfDate,
      installmentCount: loan.remainingTenureMonths
    });

    const baselineSummary = this.deps.amortizationCalculator.summarizeSchedule(baselineSchedule);
    const currentSummary = toLoanSummary(loan, baselineSummary);

    const outcomeSchedule =
      method === "reduce-emi"
        ? buildReduceEmiScheduleWithExtra({
            principal: loan.outstandingPrincipal,
            annualInterestRate: loan.annualInterestRate,
            tenureMonths: loan.remainingTenureMonths,
            asOfDate,
            monthlyExtraAmount,
            startMonthIndex,
            endMonthIndex
          })
        : this.deps.amortizationCalculator.buildScheduleFromParams({
            principal: loan.outstandingPrincipal,
            annualInterestRate: loan.annualInterestRate,
            monthlyEmi: loan.monthlyEmi,
            asOfDate,
            prepaymentByMonth,
            maxMonths: MAX_SCHEDULE_MONTHS
          });

    const outcomeSummary = this.deps.amortizationCalculator.summarizeSchedule(outcomeSchedule);
    const interestSaved = Math.max(
      baselineSummary.totalInterestRemaining - outcomeSummary.totalInterestRemaining,
      0
    );
    const monthsSaved = Math.max(baselineSummary.remainingMonths - outcomeSummary.remainingMonths, 0);
    const totalExtraPaid = sumExtraPayments(outcomeSchedule);
    const newClosureDate =
      outcomeSummary.estimatedClosureDate ||
      resolveClosureDate(asOfDate, outcomeSummary.remainingMonths);

    const finalOutstanding =
      outcomeSchedule.months.at(-1)?.closingBalance ?? loan.outstandingPrincipal;
    const firstExtraMonthRow = outcomeSchedule.months[startMonthIndex];
    const newEmi =
      method === "reduce-emi"
        ? firstExtraMonthRow?.emiPaid ?? loan.monthlyEmi
        : loan.monthlyEmi;

    const simulatedSummary: MonthlyExtraLoanSummary = {
      outstandingPrincipal: finalOutstanding,
      monthlyEmi: newEmi,
      remainingTenureMonths: outcomeSummary.remainingMonths,
      estimatedClosureDate: newClosureDate,
      totalInterestRemaining: outcomeSummary.totalInterestRemaining
    };

    const comparison: MonthlyExtraSimulationComparison = {
      previousOutstanding: loan.outstandingPrincipal,
      newOutstanding: finalOutstanding,
      previousEmi: loan.monthlyEmi,
      newEmi,
      previousTenureMonths: loan.remainingTenureMonths,
      newTenureMonths: outcomeSummary.remainingMonths,
      totalExtraPaid
    };

    const effectiveAnnualSavings = Math.round(
      (interestSaved / Math.max(outcomeSummary.remainingMonths, 1)) * 12
    );

    const explanation = buildMonthlyExtraRecommendation({
      interestSaved,
      monthsSaved,
      monthlyExtraAmount,
      context: request.recommendationContext
    });

    return {
      method,
      validation,
      currentSummary,
      simulatedSummary,
      comparison,
      interestSaved,
      monthsSaved,
      newClosureDate,
      totalExtraPaid,
      effectiveAnnualSavings,
      baselineSchedule,
      outcomeSchedule,
      explanation,
      assumptions: [...STANDARD_ASSUMPTIONS]
    };
  }
}

function buildPrepaymentMap(
  startMonthIndex: number,
  endMonthIndex: number | undefined,
  amount: number
): Record<number, number> {
  const map: Record<number, number> = {};
  const end = endMonthIndex ?? MAX_SCHEDULE_MONTHS;

  for (let monthIndex = startMonthIndex; monthIndex <= end; monthIndex += 1) {
    map[monthIndex] = amount;
  }

  return map;
}

function buildReduceEmiScheduleWithExtra(params: {
  principal: number;
  annualInterestRate: number;
  tenureMonths: number;
  asOfDate: string;
  monthlyExtraAmount: number;
  startMonthIndex: number;
  endMonthIndex?: number;
}): AmortizationSchedule {
  const monthlyRate = calculateMonthlyRate(params.annualInterestRate);
  const months: AmortizationSchedule["months"] = [];
  const endIndex = params.endMonthIndex ?? params.tenureMonths - 1;

  let openingBalance = params.principal;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  let closureMonth: string | null = null;

  for (let monthIndex = 0; monthIndex < params.tenureMonths && openingBalance > 0; monthIndex += 1) {
    const remainingMonths = params.tenureMonths - monthIndex;
    const monthlyEmi = roundMoney(
      computeEmi(openingBalance, params.annualInterestRate, remainingMonths)
    );
    const interestComponent = roundInterest(openingBalance * monthlyRate);
    const emiPaid = Math.min(monthlyEmi, openingBalance + interestComponent);
    const principalFromEmi = Math.max(emiPaid - interestComponent, 0);
    const inExtraWindow =
      monthIndex >= params.startMonthIndex && monthIndex <= endIndex;
    const prepaymentApplied = inExtraWindow
      ? Math.min(
          params.monthlyExtraAmount,
          Math.max(openingBalance - principalFromEmi, 0)
        )
      : 0;
    const principalComponent = Math.min(
      principalFromEmi + prepaymentApplied,
      openingBalance
    );
    const closingBalance = Math.max(openingBalance - principalComponent, 0);

    totalInterestPaid += interestComponent;
    totalPrincipalPaid += principalComponent;

    const calendarMonth = formatCalendarMonth(params.asOfDate, monthIndex);
    months.push({
      monthIndex: monthIndex + 1,
      calendarMonth,
      openingBalance: roundMoney(openingBalance),
      interestComponent,
      principalComponent,
      emiPaid,
      prepaymentApplied,
      closingBalance: roundMoney(closingBalance)
    });

    if (closingBalance <= 0) {
      closureMonth = calendarMonth;
      break;
    }

    openingBalance = closingBalance;
  }

  return {
    months,
    totalInterestPaid,
    totalPrincipalPaid,
    closureMonth,
    tenureMonths: months.length
  };
}

function sumExtraPayments(schedule: AmortizationSchedule): number {
  return schedule.months.reduce((total, row) => total + row.prepaymentApplied, 0);
}

function toLoanSummary(
  loan: HomeLoanSnapshot,
  summary: { remainingMonths: number; totalInterestRemaining: number; estimatedClosureDate: string }
): MonthlyExtraLoanSummary {
  return {
    outstandingPrincipal: loan.outstandingPrincipal,
    monthlyEmi: loan.monthlyEmi,
    remainingTenureMonths: loan.remainingTenureMonths,
    estimatedClosureDate:
      summary.estimatedClosureDate ||
      resolveClosureDate(loan.asOfDate, loan.remainingTenureMonths),
    totalInterestRemaining: summary.totalInterestRemaining
  };
}

function buildInvalidResult(
  request: MonthlyExtraSimulationRequest,
  validation: MonthlyExtraSimulationResult["validation"]
): MonthlyExtraSimulationResult {
  const { loan } = request;
  const emptySchedule: AmortizationSchedule = {
    months: [],
    totalInterestPaid: 0,
    totalPrincipalPaid: 0,
    closureMonth: null,
    tenureMonths: 0
  };
  const summary: MonthlyExtraLoanSummary = {
    outstandingPrincipal: loan.outstandingPrincipal,
    monthlyEmi: loan.monthlyEmi,
    remainingTenureMonths: loan.remainingTenureMonths,
    estimatedClosureDate: loan.asOfDate,
    totalInterestRemaining: 0
  };

  return {
    method: request.method ?? "reduce-tenure",
    validation,
    currentSummary: summary,
    simulatedSummary: summary,
    comparison: {
      previousOutstanding: loan.outstandingPrincipal,
      newOutstanding: loan.outstandingPrincipal,
      previousEmi: loan.monthlyEmi,
      newEmi: loan.monthlyEmi,
      previousTenureMonths: loan.remainingTenureMonths,
      newTenureMonths: loan.remainingTenureMonths,
      totalExtraPaid: 0
    },
    interestSaved: 0,
    monthsSaved: 0,
    newClosureDate: loan.asOfDate,
    totalExtraPaid: 0,
    effectiveAnnualSavings: 0,
    baselineSchedule: emptySchedule,
    outcomeSchedule: emptySchedule,
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

export const monthlyExtraPaymentSimulator = new MonthlyExtraPaymentSimulator({
  amortizationCalculator
});
