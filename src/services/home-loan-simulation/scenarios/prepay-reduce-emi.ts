import { buildAmortizationSchedule } from "@/services/home-loan-simulation/calculators/amortization-schedule";
import { calculateEmi } from "@/services/home-loan-simulation/calculators/emi";
import { resolveRemainingInstallments } from "@/services/home-loan-simulation/calculators/remaining-installments";
import { clampPrepaymentAmount } from "@/services/home-loan-simulation/validation/validate-scenario";
import {
  buildSimulationResult,
  resolveAsOfDate
} from "@/services/home-loan-simulation/scenarios/result-builder";
import { createWarningCollector } from "@/services/home-loan-simulation/scenarios/warning-collector";
import type {
  HomeLoanSimulationInput,
  HomeLoanSimulationOptions
} from "@/services/home-loan-simulation/types";

export function runPrepayReduceEmi(
  input: HomeLoanSimulationInput,
  prepaymentAmount: number,
  options?: HomeLoanSimulationOptions,
  warnings?: string[]
) {
  const activeWarnings = createWarningCollector(warnings);
  const remainingInstallments = resolveRemainingInstallments(input);
  const safePrepayment = clampPrepaymentAmount(input, prepaymentAmount);
  const revisedOutstanding = input.outstandingBalance - safePrepayment;
  const asOfDate = resolveAsOfDate(input);
  const scheduleLimit = Math.max(
    remainingInstallments,
    options?.maxScheduleMonths ?? remainingInstallments
  );

  const baselineSchedule = buildAmortizationSchedule({
    principal: input.outstandingBalance,
    annualInterestRate: input.annualInterestRate,
    monthlyEmi: input.monthlyEmi,
    asOfDate,
    installmentCount: remainingInstallments,
    maxMonths: scheduleLimit
  });

  const revisedEmi = calculateEmi(
    revisedOutstanding,
    input.annualInterestRate,
    remainingInstallments
  );

  const outcomeSchedule = buildAmortizationSchedule({
    principal: revisedOutstanding,
    annualInterestRate: input.annualInterestRate,
    monthlyEmi: revisedEmi,
    asOfDate,
    installmentCount: remainingInstallments,
    maxMonths: scheduleLimit
  });

  if (!outcomeSchedule.closureMonth && revisedOutstanding > 0) {
    activeWarnings.push("EMI reduction projection did not reach closure within the schedule cap.");
  }

  return buildSimulationResult({
    input,
    scenario: "prepay-reduce-emi",
    baselineSchedule,
    outcomeSchedule,
    revisedOutstanding,
    revisedEmi,
    warnings: activeWarnings,
    includeSchedule: options?.includeSchedule
  });
}
