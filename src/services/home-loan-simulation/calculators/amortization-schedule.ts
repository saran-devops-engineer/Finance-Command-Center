import { MAX_SCHEDULE_MONTHS } from "@/services/home-loan-simulation/constants";
import {
  calculateMonthlyRate,
  formatCalendarMonth
} from "@/services/home-loan-simulation/calculators/emi";
import type { AmortizationSchedule } from "@/services/home-loan-simulation/types";

export interface BuildScheduleParams {
  principal: number;
  annualInterestRate: number;
  monthlyEmi: number;
  asOfDate: string;
  prepaymentByMonth?: Record<number, number>;
  maxMonths?: number;
  /** When set, projects exactly this many installments (bank "tenure unchanged" path). */
  installmentCount?: number;
}

export function buildAmortizationSchedule(
  params: BuildScheduleParams
): AmortizationSchedule {
  if (params.principal <= 0) {
    return {
      months: [],
      totalInterestPaid: 0,
      totalPrincipalPaid: 0,
      closureMonth: null,
      tenureMonths: 0
    };
  }

  const maxMonths = params.maxMonths ?? MAX_SCHEDULE_MONTHS;
  const installmentLimit = params.installmentCount ?? maxMonths;
  const maxIterations = Math.min(maxMonths, installmentLimit);
  const monthlyRate = calculateMonthlyRate(params.annualInterestRate);
  const prepaymentByMonth = params.prepaymentByMonth ?? {};
  const months: AmortizationSchedule["months"] = [];

  let openingBalance = params.principal;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  let closureMonth: string | null = null;

  for (let monthIndex = 0; monthIndex < maxIterations && openingBalance > 0; monthIndex += 1) {
    const isLastPlannedInstallment =
      params.installmentCount !== undefined && monthIndex === params.installmentCount - 1;
    const interestComponent = calculateMonthlyInterest(openingBalance, monthlyRate);

    let emiPaid: number;
    let principalComponent: number;
    let prepaymentApplied = 0;

    if (isLastPlannedInstallment) {
      principalComponent = openingBalance;
      emiPaid = openingBalance + interestComponent;
    } else {
      emiPaid = Math.min(params.monthlyEmi, openingBalance + interestComponent);
      const principalFromEmi = Math.max(emiPaid - interestComponent, 0);
      prepaymentApplied = Math.min(
        prepaymentByMonth[monthIndex] ?? 0,
        Math.max(openingBalance - principalFromEmi, 0)
      );
      principalComponent = Math.min(
        principalFromEmi + prepaymentApplied,
        openingBalance
      );
    }

    const closingBalance = isLastPlannedInstallment
      ? 0
      : Math.max(openingBalance - principalComponent, 0);

    totalInterestPaid += interestComponent;
    totalPrincipalPaid += principalComponent;

    const calendarMonth = formatCalendarMonth(params.asOfDate, monthIndex);
    months.push({
      monthIndex: monthIndex + 1,
      calendarMonth,
      openingBalance: Math.round(openingBalance),
      interestComponent,
      principalComponent,
      emiPaid,
      prepaymentApplied,
      closingBalance: Math.round(closingBalance)
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

export function summarizeSchedule(schedule: AmortizationSchedule) {
  return {
    remainingMonths: schedule.tenureMonths,
    totalInterestRemaining: schedule.totalInterestPaid,
    estimatedClosureDate: schedule.closureMonth
      ? `${schedule.closureMonth}-01`
      : ""
  };
}

function calculateMonthlyInterest(openingBalance: number, monthlyRate: number) {
  return Math.round(openingBalance * monthlyRate);
}
