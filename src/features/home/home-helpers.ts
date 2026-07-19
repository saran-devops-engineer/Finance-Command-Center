import type {
  FinancialSnapshot,
  Loan,
  MoneyBreakdown,
  Recommendation,
  UpcomingDue
} from "@/shared/domain/finance";
import { formatInr } from "@/lib/utils";
import { getGoldRenewalReminder } from "@/shared/finance/gold-loan-calculations";

export const HOME_DUE_LOOKAHEAD_DAYS = 15;

const recommendationToneRank = {
  critical: 0,
  warning: 1,
  positive: 2,
  neutral: 3
} as const;

export type HomeDueDisplay =
  | { status: "clear" }
  | {
      status: "overdue" | "upcoming";
      featuredDue: UpcomingDue;
      relevantCount: number;
      hasMore: boolean;
    };

export function getHomeDueDisplay(dues: UpcomingDue[]): HomeDueDisplay {
  const overdueDues = dues
    .filter((due) => due.isOverdue || getDaysUntil(due.dueDate) < 0)
    .sort((first, second) => getDaysUntil(first.dueDate) - getDaysUntil(second.dueDate));

  if (overdueDues.length > 0) {
    return {
      status: "overdue",
      featuredDue: overdueDues[0],
      relevantCount: overdueDues.length,
      hasMore: overdueDues.length > 1
    };
  }

  const upcomingDues = dues
    .filter((due) => {
      const daysUntilDue = getDaysUntil(due.dueDate);
      return daysUntilDue >= 0 && daysUntilDue <= HOME_DUE_LOOKAHEAD_DAYS;
    })
    .sort((first, second) => getDaysUntil(first.dueDate) - getDaysUntil(second.dueDate));

  if (upcomingDues.length === 0) {
    return { status: "clear" };
  }

  return {
    status: "upcoming",
    featuredDue: upcomingDues[0],
    relevantCount: upcomingDues.length,
    hasMore: upcomingDues.length > 1
  };
}

export interface GoldRenewalAlert {
  loan: Loan;
  daysRemaining: number;
  isOverdue: boolean;
}

/**
 * Most urgent gold-loan renewal reminder within the 30-day window (or overdue).
 * Reminder milestones: 30, 15, 7, 1 days before the renewal date.
 */
export function getGoldRenewalAlert(loans: Loan[]): GoldRenewalAlert | null {
  const alerts = loans
    .filter((loan) => loan.type === "gold" && Boolean(loan.renewalDate))
    .map((loan) => {
      const reminder = getGoldRenewalReminder(loan.renewalDate ?? loan.nextDueDate);
      return { loan, reminder };
    })
    .filter(({ reminder }) => reminder.shouldRemind)
    .sort((first, second) => first.reminder.daysRemaining - second.reminder.daysRemaining);

  if (alerts.length === 0) {
    return null;
  }

  const { loan, reminder } = alerts[0];
  return { loan, daysRemaining: reminder.daysRemaining, isOverdue: reminder.isOverdue };
}

export function getPriorityLoan(loans: Loan[], pinnedLoanId: string | null) {
  if (loans.length === 0) {
    return null;
  }

  if (pinnedLoanId) {
    const pinnedLoan = loans.find((loan) => loan.id === pinnedLoanId);

    if (pinnedLoan) {
      return pinnedLoan;
    }
  }

  return [...loans].sort(compareLoanPriority)[0];
}

export function getPrimaryRecommendation(recommendations: Recommendation[]) {
  return [...recommendations].sort(
    (first, second) =>
      recommendationToneRank[first.tone] - recommendationToneRank[second.tone]
  )[0];
}

export function getRecommendationHref(
  recommendation: Recommendation,
  loans: Loan[],
  upcomingDues: UpcomingDue[]
) {
  if (recommendation.category === "debt") {
    const loan = getHighestInterestLoan(loans);
    return loan ? `/loans/${loan.id}` : "/loans";
  }

  if (recommendation.category === "cash-flow" || recommendation.category === "buffer") {
    return "/insights";
  }

  if (recommendation.category === "due-date") {
    const due = getMostUrgentDue(upcomingDues);
    const relatedLoan = due ? loans.find((loan) => due.id.includes(loan.id)) : null;
    return relatedLoan ? `/loans/${relatedLoan.id}` : "/commitments";
  }

  return "/insights";
}

export function getMeaningfulHealthMessage(
  snapshot: FinancialSnapshot,
  loans: Loan[],
  moneyBreakdown: MoneyBreakdown
) {
  const urgentDue = getMostUrgentDue(snapshot.upcomingDues);
  const highestInterestLoan = getHighestInterestLoan(loans);
  const emergencyTarget = snapshot.mandatoryCommitments * 3;

  if (snapshot.availableMoney < 0) {
    return "Mandatory commitments exceed this month's income. Cover dues before discretionary spending.";
  }

  if (urgentDue) {
    const daysUntilDue = getDaysUntil(urgentDue.dueDate);
    if (daysUntilDue < 0 || urgentDue.isOverdue) {
      return `${urgentDue.title} is overdue. Clear it before optional spending.`;
    }

    if (daysUntilDue === 0) {
      return `${urgentDue.title} is due today. Keep ${formatInr(urgentDue.amount)} ready.`;
    }

    if (daysUntilDue === 1) {
      return `${urgentDue.title} is due tomorrow. Keep ${formatInr(urgentDue.amount)} ready.`;
    }

    if (daysUntilDue <= HOME_DUE_LOOKAHEAD_DAYS) {
      return `${urgentDue.title} is due in ${daysUntilDue} days. Plan this before using available money.`;
    }
  }

  if (moneyBreakdown.emergencyBuffer < emergencyTarget) {
    return `Emergency fund is below the suggested target of ${formatInr(emergencyTarget)}.`;
  }

  if (highestInterestLoan) {
    return `${highestInterestLoan.name} has the highest interest at ${highestInterestLoan.annualInterestRate}% p.a.`;
  }

  return snapshot.healthReason;
}

export function formatDueLabel(date: string) {
  const daysUntilDue = getDaysUntil(date);

  if (daysUntilDue < 0) {
    return `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? "" : "s"} overdue`;
  }

  if (daysUntilDue === 0) {
    return "Due today";
  }

  if (daysUntilDue === 1) {
    return "Due tomorrow";
  }

  if (daysUntilDue <= HOME_DUE_LOOKAHEAD_DAYS) {
    return `Due in ${daysUntilDue} days`;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short"
  }).format(new Date(`${date}T00:00:00`));
}

function compareLoanPriority(first: Loan, second: Loan) {
  return getLoanPriorityScore(second) - getLoanPriorityScore(first);
}

function getLoanPriorityScore(loan: Loan) {
  const dueSoonBoost = getDaysUntil(loan.nextDueDate) <= 7 ? 500 : 0;
  const overdueBoost = loan.isOverdue ? 1000 : 0;
  const goldLoanBoost = loan.type === "gold" ? 250 : 0;

  return overdueBoost + dueSoonBoost + goldLoanBoost + loan.annualInterestRate * 20;
}

function getHighestInterestLoan(loans: Loan[]) {
  return [...loans].sort(
    (first, second) => second.annualInterestRate - first.annualInterestRate
  )[0];
}

function getMostUrgentDue(upcomingDues: UpcomingDue[]) {
  return [...upcomingDues].sort((first, second) => {
    const firstDays = getDaysUntil(first.dueDate);
    const secondDays = getDaysUntil(second.dueDate);

    if (first.isOverdue && !second.isOverdue) {
      return -1;
    }

    if (!first.isOverdue && second.isOverdue) {
      return 1;
    }

    if (firstDays < 0 && secondDays >= 0) {
      return -1;
    }

    if (firstDays >= 0 && secondDays < 0) {
      return 1;
    }

    return firstDays - secondDays;
  })[0];
}

function getDaysUntil(date: string) {
  const targetDate = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.ceil((targetDate.getTime() - today.getTime()) / 86_400_000);
}
