import { MAX_SCHEDULE_MONTHS } from "@/engines/loan/home-loan/constants";
import type {
  AmortizationRequest,
  AmortizationSchedule
} from "@/engines/loan/home-loan/types/LoanInterfaces";
import { calculateMonthlyRate } from "@/engines/loan/home-loan/utils/rates";
import { roundInterest, roundMoney } from "@/engines/loan/home-loan/utils/money";
import { formatCalendarMonth } from "@/engines/loan/home-loan/utils/dates";

export interface AmortizationCalculator {
  buildSchedule(request: AmortizationRequest): AmortizationSchedule;
  buildScheduleFromParams(params: BuildScheduleParams): AmortizationSchedule;
  summarizeSchedule(schedule: AmortizationSchedule): ScheduleSummary;
}

export interface BuildScheduleParams {
  principal: number;
  annualInterestRate: number;
  monthlyEmi: number;
  asOfDate: string;
  prepaymentByMonth?: Record<number, number>;
  maxMonths?: number;
  installmentCount?: number;
}

export interface ScheduleSummary {
  remainingMonths: number;
  totalInterestRemaining: number;
  estimatedClosureDate: string;
}

export class HomeLoanAmortizationCalculator implements AmortizationCalculator {
  buildSchedule(request: AmortizationRequest): AmortizationSchedule {
    return this.buildScheduleFromParams({
      principal: request.loan.outstandingPrincipal,
      annualInterestRate: request.loan.annualInterestRate,
      monthlyEmi: request.loan.monthlyEmi,
      asOfDate: request.loan.asOfDate,
      maxMonths: request.maxMonths ?? MAX_SCHEDULE_MONTHS,
      installmentCount: request.loan.remainingTenureMonths
    });
  }

  buildScheduleFromParams(params: BuildScheduleParams): AmortizationSchedule {
    if (params.principal <= 0) {
      return emptySchedule();
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
      const interestComponent = roundInterest(openingBalance * monthlyRate);

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
        principalComponent = Math.min(principalFromEmi + prepaymentApplied, openingBalance);
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

  summarizeSchedule(schedule: AmortizationSchedule): ScheduleSummary {
    return {
      remainingMonths: schedule.tenureMonths,
      totalInterestRemaining: schedule.totalInterestPaid,
      estimatedClosureDate: schedule.closureMonth ? `${schedule.closureMonth}-01` : ""
    };
  }
}

function emptySchedule(): AmortizationSchedule {
  return {
    months: [],
    totalInterestPaid: 0,
    totalPrincipalPaid: 0,
    closureMonth: null,
    tenureMonths: 0
  };
}

export const amortizationCalculator: AmortizationCalculator = new HomeLoanAmortizationCalculator();
