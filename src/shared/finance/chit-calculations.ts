import type { Chit, ChitDerivedMetrics } from "@/shared/domain/chit";

export function computeRemainingMonths(
  totalDurationMonths: number,
  currentRunningMonth: number
) {
  return Math.max(totalDurationMonths - currentRunningMonth, 0);
}

export function computeChitNextDueDate(
  startDate: string,
  currentRunningMonth: number
) {
  if (!startDate || currentRunningMonth <= 0) {
    return startDate;
  }

  const start = new Date(`${startDate.slice(0, 10)}T00:00:00`);
  const due = new Date(
    start.getFullYear(),
    start.getMonth() + currentRunningMonth,
    start.getDate()
  );

  return due.toISOString().slice(0, 10);
}

export function deriveChitMetrics(
  chit: Pick<
    Chit,
    | "totalDurationMonths"
    | "currentRunningMonth"
    | "monthlyContribution"
    | "prizeReceived"
    | "startDate"
  >
): ChitDerivedMetrics {
  const remainingMonths = computeRemainingMonths(
    chit.totalDurationMonths,
    chit.currentRunningMonth
  );
  const remainingContributions = remainingMonths;
  const totalRemainingContribution = remainingMonths * chit.monthlyContribution;

  return {
    remainingMonths,
    remainingContributions,
    totalRemainingContribution,
    expectedRemainingParticipation: chit.prizeReceived ? 0 : totalRemainingContribution,
    remainingInstallments: chit.prizeReceived ? remainingMonths : 0,
    isComplete: remainingMonths === 0,
    shouldSuggestArchive: remainingMonths === 0
  };
}

export function applyChitDerivedFields(chit: Chit): Chit {
  const metrics = deriveChitMetrics(chit);

  return {
    ...chit,
    nextDueDate:
      metrics.remainingMonths > 0
        ? computeChitNextDueDate(chit.startDate, chit.currentRunningMonth)
        : chit.startDate
  };
}

export function getChitMonthlyCashFlowAmount(chit: Chit) {
  if (chit.status === "archived" || chit.status === "deleted") {
    return 0;
  }

  const metrics = deriveChitMetrics(chit);
  return metrics.remainingMonths > 0 ? chit.monthlyContribution : 0;
}
