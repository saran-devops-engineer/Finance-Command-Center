import type { Chit } from "@/shared/domain/chit";
import type { Loan, LoanPayment } from "@/shared/domain/finance";
import {
  FreshnessStatus,
  TimelineActivityKind,
  TimelineEventStatus,
  TimelineEventType,
  type FinancialTimeline,
  type LastConfirmedState,
  type TimelineActivity,
  type TimelineEvent
} from "@/shared/domain/financial-timeline";
import { ProductTypeId } from "@/shared/domain/product";
import {
  buildChitContributionSchedule,
  buildLoanEmiSchedule,
  resolveEventTypeForProduct
} from "@/engines/financial-timeline/scheduler/recurring-scheduler";
import { compareCalendarDates } from "@/engines/financial-timeline/scheduler/date-utils";

export interface BootstrapTimelineBundle {
  timeline: FinancialTimeline;
  events: TimelineEvent[];
  activities: TimelineActivity[];
}

function latestPaymentDate(payments: LoanPayment[], fallback: string): string {
  if (payments.length === 0) {
    return fallback;
  }

  return payments
    .map((payment) => payment.paidOn.slice(0, 10))
    .sort((a, b) => compareCalendarDates(b, a))[0]!;
}

export function bootstrapTimelineFromLoan(params: {
  loan: Loan;
  payments: LoanPayment[];
  nowIso: string;
}): BootstrapTimelineBundle {
  const timelineId = `timeline-loan-${params.loan.id}`;
  const startDate = params.loan.loanStartDate ?? params.loan.nextDueDate;
  const emiDay = params.loan.emiPaymentDay ?? new Date(`${params.loan.nextDueDate}T00:00:00`).getDate();
  const asOfDate = latestPaymentDate(params.payments, startDate);

  const schedule =
    params.loan.type === "gold"
      ? {
          frequency: "monthly" as const,
          startDate,
          dueDayOfMonth: emiDay,
          installmentCount: params.loan.remainingTenureMonths,
          amount: params.loan.monthlyEmi,
          eventType: TimelineEventType.RENEWAL
        }
      : buildLoanEmiSchedule({
          startDate,
          emiPaymentDay: emiDay,
          monthlyEmi: params.loan.monthlyEmi,
          remainingTenureMonths: params.loan.remainingTenureMonths
        });

  const lastConfirmedState: LastConfirmedState = {
    confirmedAt: params.nowIso,
    confirmedActivityId: `${timelineId}-seed`,
    asOfDate,
    outstandingBalance: params.loan.outstandingBalance,
    remainingTenureMonths: params.loan.remainingTenureMonths,
    snapshot: {
      annualInterestRate: params.loan.annualInterestRate,
      monthlyEmi: params.loan.monthlyEmi,
      lender: params.loan.lender
    }
  };

  const timeline: FinancialTimeline = {
    id: timelineId,
    productTypeId: params.loan.type === "gold" ? ProductTypeId.GOLD_LOANS : ProductTypeId.LOANS,
    productId: params.loan.id,
    schedule,
    confirmationMode: null,
    lastConfirmedState,
    freshnessStatus: FreshnessStatus.GOOD,
    freshnessScore: 4,
    status: params.loan.status === "archived" ? "archived" : "active",
    createdAt: params.nowIso,
    updatedAt: params.nowIso
  };

  const activities: TimelineActivity[] = [
    {
      id: `${timelineId}-created`,
      timelineId,
      kind: TimelineActivityKind.PRODUCT_CREATED,
      title: "Loan created",
      description: params.loan.name,
      occurredAt: params.nowIso,
      createdAt: params.nowIso
    }
  ];

  const events: TimelineEvent[] = params.payments.map((payment, index) => ({
    id: `${timelineId}-payment-${payment.id}`,
    timelineId,
    sequenceNumber: index + 1,
    eventType:
      payment.kind === "prepayment" || payment.kind === "part-payment"
        ? TimelineEventType.PREPAYMENT
        : resolveEventTypeForProduct(timeline.productTypeId, params.loan.type),
    scheduledDate: payment.paidOn.slice(0, 10),
    dueDate: payment.paidOn.slice(0, 10),
    amount: payment.amount,
    status: TimelineEventStatus.CONFIRMED,
    confirmedAt: payment.paidOn,
    confirmedActivityId: `${timelineId}-payment-act-${payment.id}`,
    metadata: {
      principalAmount: payment.principalAmount,
      interestAmount: payment.interestAmount,
      outstandingBalanceAfter: params.loan.outstandingBalance
    },
    createdAt: params.nowIso,
    updatedAt: params.nowIso
  }));

  for (const payment of params.payments) {
    activities.push({
      id: `${timelineId}-payment-act-${payment.id}`,
      timelineId,
      kind:
        payment.kind === "prepayment" || payment.kind === "part-payment"
          ? TimelineActivityKind.PREPAYMENT
          : TimelineActivityKind.EVENT_CONFIRMED,
      title: payment.kind === "emi" ? "EMI confirmed" : "Prepayment recorded",
      occurredAt: payment.paidOn,
      eventId: `${timelineId}-payment-${payment.id}`,
      stateDelta: {
        amount: payment.amount,
        principalAmount: payment.principalAmount
      },
      createdAt: params.nowIso
    });
  }

  return { timeline, events, activities };
}

export function bootstrapTimelineFromChit(params: {
  chit: Chit;
  nowIso: string;
}): BootstrapTimelineBundle {
  const timelineId = `timeline-chit-${params.chit.id}`;
  const dueDay = new Date(`${params.chit.nextDueDate}T00:00:00`).getDate();

  const schedule = buildChitContributionSchedule({
    startDate: params.chit.startDate,
    dueDayOfMonth: dueDay,
    monthlyContribution: params.chit.monthlyContribution,
    remainingMonths: params.chit.totalDurationMonths - params.chit.currentRunningMonth + 1
  });

  const lastConfirmedState: LastConfirmedState = {
    confirmedAt: params.nowIso,
    confirmedActivityId: `${timelineId}-seed`,
    asOfDate: params.chit.nextDueDate,
    snapshot: {
      chitName: params.chit.chitName,
      monthlyContribution: params.chit.monthlyContribution
    }
  };

  const timeline: FinancialTimeline = {
    id: timelineId,
    productTypeId: ProductTypeId.CHITS,
    productId: params.chit.id,
    schedule,
    confirmationMode: null,
    lastConfirmedState,
    freshnessStatus: FreshnessStatus.GOOD,
    freshnessScore: 4,
    status: params.chit.status === "archived" ? "archived" : "active",
    createdAt: params.nowIso,
    updatedAt: params.nowIso
  };

  const activities: TimelineActivity[] = [
    {
      id: `${timelineId}-created`,
      timelineId,
      kind: TimelineActivityKind.PRODUCT_CREATED,
      title: "Chit created",
      description: params.chit.chitName,
      occurredAt: params.nowIso,
      createdAt: params.nowIso
    }
  ];

  return { timeline, events: [], activities };
}

export interface TimelineMigrationInput {
  loans: Loan[];
  loanPayments: LoanPayment[];
  chits: Chit[];
  nowIso?: string;
}

export interface TimelineMigrationResult {
  migrated: boolean;
  timelines: FinancialTimeline[];
  events: TimelineEvent[];
  activities: TimelineActivity[];
  notes: string[];
}

export function migrateProductsToFinancialTimelines(
  input: TimelineMigrationInput
): TimelineMigrationResult {
  const nowIso = input.nowIso ?? new Date().toISOString();
  const timelines: FinancialTimeline[] = [];
  const events: TimelineEvent[] = [];
  const activities: TimelineActivity[] = [];
  const notes: string[] = [];

  for (const loan of input.loans.filter((entry) => entry.status !== "deleted")) {
    const payments = input.loanPayments.filter((payment) => payment.loanId === loan.id);
    const bundle = bootstrapTimelineFromLoan({ loan, payments, nowIso });
    timelines.push(bundle.timeline);
    events.push(...bundle.events);
    activities.push(...bundle.activities);
    notes.push(`Bootstrapped timeline for loan ${loan.id}`);
  }

  for (const chit of input.chits) {
    const bundle = bootstrapTimelineFromChit({ chit, nowIso });
    timelines.push(bundle.timeline);
    events.push(...bundle.events);
    activities.push(...bundle.activities);
    notes.push(`Bootstrapped timeline for chit ${chit.id}`);
  }

  return {
    migrated: timelines.length > 0,
    timelines,
    events,
    activities,
    notes
  };
}
