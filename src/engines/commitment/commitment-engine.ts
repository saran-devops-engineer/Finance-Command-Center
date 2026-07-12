import { endOfMonth, getDaysUntil, isNextCalendarMonth, isSameCalendarMonth } from "@/engines/commitment/commitment-utils";
import { chitCommitmentProvider } from "@/engines/commitment/providers/chit-commitment-provider";
import { goldLoanCommitmentProvider } from "@/engines/commitment/providers/gold-loan-commitment-provider";
import { homeLoanCommitmentProvider } from "@/engines/commitment/providers/home-loan-commitment-provider";
import type {
  CommitmentBuildContext,
  CommitmentGroup,
  CommitmentProvider,
  FinancialCommitment
} from "@/engines/commitment/types";

const defaultProviders: CommitmentProvider[] = [
  homeLoanCommitmentProvider,
  goldLoanCommitmentProvider,
  chitCommitmentProvider
];

const registeredProviders: CommitmentProvider[] = [...defaultProviders];

/** Register a module provider without modifying existing providers. */
export function registerCommitmentProvider(provider: CommitmentProvider) {
  if (registeredProviders.some((entry) => entry.moduleId === provider.moduleId)) {
    return;
  }

  registeredProviders.push(provider);
}

export function buildFinancialCommitments(context: CommitmentBuildContext): FinancialCommitment[] {
  return registeredProviders
    .flatMap((provider) => provider.buildCommitments(context))
    .filter((commitment) => commitment.status !== "completed")
    .sort(
      (first, second) =>
        getDaysUntil(first.dueDate, context.referenceDate) -
        getDaysUntil(second.dueDate, context.referenceDate)
    );
}

export function groupFinancialCommitments(
  commitments: FinancialCommitment[],
  referenceDate?: string
): CommitmentGroup[] {
  const reference = referenceDate
    ? new Date(`${referenceDate.slice(0, 10)}T00:00:00`)
    : new Date();
  reference.setHours(0, 0, 0, 0);

  const nextMonthEnd = endOfMonth(new Date(reference.getFullYear(), reference.getMonth() + 1, 1));
  const horizonEnd = new Date(reference);
  horizonEnd.setDate(horizonEnd.getDate() + 90);

  const thisMonth = commitments.filter((commitment) =>
    isSameCalendarMonth(commitment.dueDate, reference)
  );
  const nextMonth = commitments.filter(
    (commitment) =>
      !isSameCalendarMonth(commitment.dueDate, reference) &&
      isNextCalendarMonth(commitment.dueDate, reference)
  );
  const next90Days = commitments.filter((commitment) => {
    const due = new Date(`${commitment.dueDate.slice(0, 10)}T00:00:00`);

    if (isSameCalendarMonth(commitment.dueDate, reference)) {
      return false;
    }

    if (isNextCalendarMonth(commitment.dueDate, reference)) {
      return false;
    }

    return due > nextMonthEnd && due <= horizonEnd;
  });

  return [
    buildGroup("this-month", "This Month", thisMonth),
    buildGroup("next-month", "Next Month", nextMonth),
    buildGroup("next-90-days", "Next 90 Days", next90Days)
  ].filter((group) => group.commitments.length > 0);
}

function buildGroup(
  id: CommitmentGroup["id"],
  label: string,
  commitments: FinancialCommitment[]
): CommitmentGroup {
  return {
    id,
    label,
    commitments,
    totalAmount: commitments.reduce((sum, commitment) => sum + commitment.amount, 0)
  };
}

export function sumCommitmentAmount(commitments: FinancialCommitment[]) {
  return commitments.reduce((sum, commitment) => sum + commitment.amount, 0);
}

export function sumCommitmentsForMonth(
  commitments: FinancialCommitment[],
  referenceDate?: string
) {
  const reference = referenceDate
    ? new Date(`${referenceDate.slice(0, 10)}T00:00:00`)
    : new Date();

  return sumCommitmentAmount(
    commitments.filter((commitment) => isSameCalendarMonth(commitment.dueDate, reference))
  );
}
