import {
  FreshnessStatus,
  TimelineEventStatus,
  TimelineEventType,
  type FinancialTimeline,
  type TimelineEvent
} from "@/shared/domain/financial-timeline";
import { ProductTypeId } from "@/shared/domain/product";
import { createNotificationTestId } from "@/notifications/testing/constants";

export type NotificationTestScenario =
  | "emi_due_tomorrow"
  | "insurance_due"
  | "credit_card_due"
  | "subscription_due"
  | "overdue_payment"
  | "pending_confirmation"
  | "missed_confirmation";

export interface NotificationTestFixture {
  timeline: FinancialTimeline;
  event: TimelineEvent;
  scenario: NotificationTestScenario;
}

function addDays(referenceDate: string, days: number): string {
  const date = new Date(`${referenceDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function createTimeline(
  suffix: string,
  productTypeId: typeof ProductTypeId.LOANS | typeof ProductTypeId.INSURANCE | typeof ProductTypeId.INVESTMENTS,
  label: string,
  nowIso: string
): FinancialTimeline {
  const timelineId = createNotificationTestId(`timeline-${suffix}`);
  const productId = createNotificationTestId(`product-${suffix}`);

  return {
    id: timelineId,
    productTypeId,
    productId,
    schedule: {
      frequency: "monthly",
      startDate: nowIso.slice(0, 10),
      dueDayOfMonth: 5,
      installmentCount: 12,
      amount: 18_450,
      eventType: TimelineEventType.EMI
    },
    confirmationMode: null,
    lastConfirmedState: {
      confirmedAt: nowIso,
      confirmedActivityId: createNotificationTestId(`activity-${suffix}`),
      asOfDate: nowIso.slice(0, 10),
      outstandingBalance: 1_500_000,
      remainingTenureMonths: 180,
      snapshot: { lender: label, monthlyEmi: 18_450 }
    },
    freshnessStatus: FreshnessStatus.GOOD,
    freshnessScore: 4,
    status: "active",
    createdAt: nowIso,
    updatedAt: nowIso
  };
}

function createEvent(
  timeline: FinancialTimeline,
  suffix: string,
  dueDate: string,
  amount: number,
  eventType: TimelineEvent["eventType"],
  status: TimelineEvent["status"],
  nowIso: string
): TimelineEvent {
  return {
    id: createNotificationTestId(`event-${suffix}`),
    timelineId: timeline.id,
    sequenceNumber: 1,
    eventType,
    scheduledDate: dueDate,
    dueDate,
    amount,
    status,
    createdAt: nowIso,
    updatedAt: nowIso
  };
}

export function buildNotificationTestFixture(
  scenario: NotificationTestScenario,
  referenceDate: string,
  nowIso: string,
  index = 0
): NotificationTestFixture {
  const suffix = `${scenario}-${index}-${Date.now()}`;

  switch (scenario) {
    case "emi_due_tomorrow": {
      const timeline = createTimeline(suffix, ProductTypeId.LOANS, "HDFC Home Loan", nowIso);
      const event = createEvent(
        timeline,
        suffix,
        addDays(referenceDate, 1),
        18_450,
        TimelineEventType.EMI,
        TimelineEventStatus.SCHEDULED,
        nowIso
      );
      return { timeline, event, scenario };
    }
    case "insurance_due": {
      const timeline = createTimeline(suffix, ProductTypeId.INSURANCE, "Health Insurance", nowIso);
      const event = createEvent(
        timeline,
        suffix,
        addDays(referenceDate, 3),
        12_500,
        TimelineEventType.PREMIUM,
        TimelineEventStatus.SCHEDULED,
        nowIso
      );
      return { timeline, event, scenario };
    }
    case "credit_card_due": {
      const timeline = createTimeline(suffix, ProductTypeId.LOANS, "Credit Card", nowIso);
      const event = createEvent(
        timeline,
        suffix,
        addDays(referenceDate, 0),
        8_200,
        TimelineEventType.INSTALLMENT,
        TimelineEventStatus.DUE,
        nowIso
      );
      return { timeline, event, scenario };
    }
    case "subscription_due": {
      const timeline = createTimeline(suffix, ProductTypeId.INVESTMENTS, "Streaming Subscription", nowIso);
      timeline.schedule.eventType = TimelineEventType.SUBSCRIPTION;
      timeline.lastConfirmedState.snapshot = { lender: "Streaming Subscription", monthlyEmi: 799 };
      const event = createEvent(
        timeline,
        suffix,
        addDays(referenceDate, 7),
        799,
        TimelineEventType.SUBSCRIPTION,
        TimelineEventStatus.SCHEDULED,
        nowIso
      );
      return { timeline, event, scenario };
    }
    case "overdue_payment": {
      const timeline = createTimeline(suffix, ProductTypeId.LOANS, "Personal Loan", nowIso);
      const event = createEvent(
        timeline,
        suffix,
        addDays(referenceDate, -2),
        9_500,
        TimelineEventType.EMI,
        TimelineEventStatus.DUE,
        nowIso
      );
      return { timeline, event, scenario };
    }
    case "pending_confirmation": {
      const timeline = createTimeline(suffix, ProductTypeId.LOANS, "Home Loan EMI", nowIso);
      const event = createEvent(
        timeline,
        suffix,
        addDays(referenceDate, -1),
        18_450,
        TimelineEventType.EMI,
        TimelineEventStatus.PENDING_CONFIRMATION,
        nowIso
      );
      return { timeline, event, scenario };
    }
    case "missed_confirmation": {
      const timeline = createTimeline(suffix, ProductTypeId.LOANS, "Home Loan EMI", nowIso);
      const event = createEvent(
        timeline,
        suffix,
        addDays(referenceDate, -5),
        18_450,
        TimelineEventType.EMI,
        TimelineEventStatus.MISSED,
        nowIso
      );
      return { timeline, event, scenario };
    }
  }
}

export function buildGroupingTestFixtures(referenceDate: string, nowIso: string): NotificationTestFixture[] {
  const scenarios: Array<{ scenario: NotificationTestScenario; label: string }> = [
    { scenario: "emi_due_tomorrow", label: "Home Loan" },
    { scenario: "insurance_due", label: "Insurance" },
    { scenario: "credit_card_due", label: "Electricity" },
    { scenario: "subscription_due", label: "Subscription" }
  ];

  return scenarios.map((entry, index) => {
    const fixture = buildNotificationTestFixture(entry.scenario, referenceDate, nowIso, index);
    fixture.timeline.lastConfirmedState.snapshot = { lender: entry.label, monthlyEmi: 1000 + index * 100 };
    fixture.event.dueDate = addDays(referenceDate, 1);
    fixture.event.scheduledDate = fixture.event.dueDate;
    return fixture;
  });
}

export function buildBulkTestFixtures(
  count: number,
  referenceDate: string,
  nowIso: string
): NotificationTestFixture[] {
  const scenarios: NotificationTestScenario[] = [
    "emi_due_tomorrow",
    "insurance_due",
    "credit_card_due",
    "subscription_due",
    "overdue_payment"
  ];

  return Array.from({ length: count }, (_, index) =>
    buildNotificationTestFixture(scenarios[index % scenarios.length]!, referenceDate, nowIso, index)
  );
}
