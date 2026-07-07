import type {
  AmortizationSchedule,
  DebugMonthComparison,
  DebugReport,
  DebugFormulaValues,
  ScheduleComparison
} from "@/engines/loan/home-loan/core/types";

export function compareSchedules(
  original: AmortizationSchedule,
  simulated: AmortizationSchedule
): ScheduleComparison {
  const interestSaved = original.totalInterest - simulated.totalInterest;
  const monthsSaved = original.tenureMonths - simulated.tenureMonths;

  return {
    original,
    simulated,
    interestSaved: Math.max(interestSaved, 0),
    monthsSaved: Math.max(monthsSaved, 0),
    totalPaymentsDelta: simulated.totalPayments - original.totalPayments,
    closureDateDeltaMonths: monthsSaved
  };
}

export function buildDebugReport(
  formulas: DebugFormulaValues,
  original: AmortizationSchedule,
  simulated: AmortizationSchedule
): DebugReport {
  const maxMonths = Math.max(original.rows.length, simulated.rows.length);
  const monthComparisons: DebugMonthComparison[] = [];

  for (let index = 0; index < maxMonths; index += 1) {
    const originalRow = original.rows[index];
    const simulatedRow = simulated.rows[index];

    monthComparisons.push({
      monthNumber: index + 1,
      originalInterest: originalRow?.interest ?? null,
      simulatedInterest: simulatedRow?.interest ?? null,
      originalClosingBalance: originalRow?.closingBalance ?? null,
      simulatedClosingBalance: simulatedRow?.closingBalance ?? null
    });
  }

  return {
    formulas,
    originalSchedule: original,
    simulationSchedule: simulated,
    monthComparisons
  };
}
