import { describe, expect, it } from "vitest";
import {
  ConfirmationMode,
  FreshnessStatus,
  RecurrenceFrequency,
  TimelineEventStatus,
  TimelineEventType,
  assertTimelineEventTransition,
  canTransitionTimelineEvent,
  type FinancialTimeline,
  type LastConfirmedState,
  type TimelineEvent
} from "@/shared/domain/financial-timeline";
import { ProductTypeId } from "@/shared/domain/product";
import type { Loan, LoanPayment } from "@/shared/domain/finance";
import {
  addDays,
  addMonthsPreservingDueDay,
  compareCalendarDates,
  daysBetween,
  isLeapYear,
  parseCalendarDate
} from "@/engines/financial-timeline/scheduler/date-utils";
import {
  buildLoanEmiSchedule,
  generateExpectedTimelineEvents
} from "@/engines/financial-timeline/scheduler/recurring-scheduler";
import {
  advanceAllTimelineEvents,
  transitionTimelineEvent
} from "@/engines/financial-timeline/timeline/event-transition";
import {
  confirmTimelineEvent,
  processFinancialTimeline
} from "@/engines/financial-timeline/timeline/timeline-engine";
import {
  getConfirmationStrategy,
  runConfirmationEngine
} from "@/engines/financial-timeline/confirmation/confirmation-engine";
import { evaluateConfidence } from "@/engines/financial-timeline/confidence/confidence-engine";
import { calculateFreshness } from "@/engines/financial-timeline/freshness/freshness-calculator";
import { deriveConfirmedProductState } from "@/engines/financial-timeline/state/state-manager";
import { DEFAULT_FINANCIAL_TIMELINE_SETTINGS } from "@/engines/financial-timeline/settings/defaults";
import { bootstrapTimelineFromLoan } from "@/engines/financial-timeline/migration/bootstrap-timeline";

const NOW = "2026-07-21T12:00:00.000Z";

function baseTimeline(overrides: Partial<FinancialTimeline> = {}): FinancialTimeline {
  const lastConfirmedState: LastConfirmedState = {
    confirmedAt: "2026-07-01T00:00:00.000Z",
    confirmedActivityId: "act-seed",
    asOfDate: "2026-07-01",
    outstandingBalance: 800_000,
    remainingTenureMonths: 222,
    snapshot: { monthlyEmi: 10_000 }
  };

  return {
    id: "timeline-loan-test",
    productTypeId: ProductTypeId.LOANS,
    productId: "loan-test",
    schedule: buildLoanEmiSchedule({
      startDate: "2024-01-05",
      emiPaymentDay: 5,
      monthlyEmi: 10_000,
      remainingTenureMonths: 222
    }),
    confirmationMode: null,
    lastConfirmedState,
    freshnessStatus: FreshnessStatus.GOOD,
    freshnessScore: 4,
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides
  };
}

function sampleLoan(): Loan {
  return {
    id: "loan-1",
    name: "Home Loan",
    type: "home",
    lender: "Test Bank",
    originalAmount: 2_000_000,
    outstandingBalance: 1_500_000,
    annualInterestRate: 8.5,
    monthlyEmi: 18_500,
    principalPaid: 500_000,
    interestPaid: 120_000,
    remainingTenureMonths: 180,
    estimatedClosureDate: "2040-01-05",
    nextDueDate: "2026-07-05",
    loanStartDate: "2020-01-05",
    emiPaymentDay: 5,
    status: "active"
  };
}

describe("Financial Timeline event lifecycle", () => {
  it("allows only legal transitions — never scheduled → confirmed", () => {
    expect(canTransitionTimelineEvent("scheduled", "due")).toBe(true);
    expect(canTransitionTimelineEvent("due", "pending_confirmation")).toBe(true);
    expect(canTransitionTimelineEvent("pending_confirmation", "confirmed")).toBe(true);
    expect(canTransitionTimelineEvent("scheduled", "confirmed")).toBe(false);

    expect(() => assertTimelineEventTransition("scheduled", "confirmed")).toThrow(
      /Invalid timeline event transition/
    );
  });

  it("advances events through scheduled → due → pending confirmation", () => {
    const event: TimelineEvent = {
      id: "evt-1",
      timelineId: "timeline-loan-test",
      sequenceNumber: 1,
      eventType: TimelineEventType.EMI,
      scheduledDate: "2026-07-05",
      dueDate: "2026-07-05",
      amount: 10_000,
      status: TimelineEventStatus.SCHEDULED,
      createdAt: NOW,
      updatedAt: NOW
    };

    const due = advanceAllTimelineEvents([event], "2026-07-05", NOW)[0]!;
    expect(due.status).toBe(TimelineEventStatus.DUE);

    const pending = advanceAllTimelineEvents([due], "2026-07-06", NOW)[0]!;
    expect(pending.status).toBe(TimelineEventStatus.PENDING_CONFIRMATION);
  });
});

describe("Financial Timeline date utilities", () => {
  it("handles month-end due days (31 → 30/28)", () => {
    expect(addMonthsPreservingDueDay("2026-01-31", 1, 31)).toBe("2026-02-28");
    expect(addMonthsPreservingDueDay("2024-01-31", 1, 31)).toBe("2024-02-29");
  });

  it("detects leap years", () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2026)).toBe(false);
  });

  it("compares calendar dates without timezone drift", () => {
    expect(compareCalendarDates("2026-07-01", "2026-07-21")).toBeLessThan(0);
    expect(daysBetween("2026-07-01", "2026-07-21")).toBe(20);
  });

  it("parses YYYY-MM-DD as local calendar dates", () => {
    const parsed = parseCalendarDate("2026-07-05");
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(6);
    expect(parsed.getDate()).toBe(5);
  });
});

describe("Financial Timeline recurring scheduler", () => {
  it("generates monthly EMIs from last confirmed date", () => {
    const events = generateExpectedTimelineEvents({
      timelineId: "timeline-loan-test",
      schedule: buildLoanEmiSchedule({
        startDate: "2026-07-01",
        emiPaymentDay: 5,
        monthlyEmi: 10_000,
        remainingTenureMonths: 12
      }),
      fromDate: "2026-07-01",
      toDate: "2026-10-05",
      startingSequence: 1,
      referenceNow: NOW
    });

    expect(events.length).toBeGreaterThanOrEqual(3);
    expect(events[0]?.dueDate).toBe("2026-07-05");
    expect(events.every((event) => event.eventType === TimelineEventType.EMI)).toBe(true);
  });

  it("marks past-due generated events as pending confirmation", () => {
    const events = generateExpectedTimelineEvents({
      timelineId: "timeline-loan-test",
      schedule: buildLoanEmiSchedule({
        startDate: "2026-07-01",
        emiPaymentDay: 5,
        monthlyEmi: 10_000,
        remainingTenureMonths: 6
      }),
      fromDate: "2026-07-01",
      toDate: "2026-07-20",
      startingSequence: 1,
      referenceNow: NOW
    });

    expect(events.some((event) => event.status === TimelineEventStatus.PENDING_CONFIRMATION)).toBe(
      true
    );
  });
});

describe("Financial Timeline engine scenarios", () => {
  it("detects EMI due yesterday as pending confirmation", () => {
    const result = processFinancialTimeline({
      timeline: baseTimeline(),
      events: [],
      activities: [],
      settings: DEFAULT_FINANCIAL_TIMELINE_SETTINGS,
      referenceDate: "2026-07-06",
      nowIso: NOW
    });

    expect(result.dashboard.pendingConfirmationCount).toBeGreaterThanOrEqual(1);
    expect(result.confirmedState.remainingTenureMonths).toBe(222);
  });

  it("does not reduce tenure from pending events after short absence", () => {
    const result = processFinancialTimeline({
      timeline: baseTimeline({
        lastConfirmedState: {
          ...baseTimeline().lastConfirmedState,
          asOfDate: "2026-07-01"
        }
      }),
      events: [],
      activities: [],
      settings: DEFAULT_FINANCIAL_TIMELINE_SETTINGS,
      referenceDate: "2026-07-06",
      nowIso: NOW
    });

    expect(result.dashboard.pendingConfirmationCount).toBeGreaterThanOrEqual(1);
    expect(result.confirmedState.remainingTenureMonths).toBe(222);
  });

  it("accumulates pending confirmations after 120-day absence without auto-changing state", () => {
    const result = processFinancialTimeline({
      timeline: baseTimeline({
        lastConfirmedState: {
          ...baseTimeline().lastConfirmedState,
          asOfDate: "2026-03-01"
        }
      }),
      events: [],
      activities: [],
      settings: {
        ...DEFAULT_FINANCIAL_TIMELINE_SETTINGS,
        defaultConfirmationMode: ConfirmationMode.MANUAL
      },
      referenceDate: "2026-07-21",
      nowIso: NOW
    });

    expect(result.dashboard.pendingConfirmationCount).toBeGreaterThanOrEqual(4);
    expect(result.confirmedState.remainingTenureMonths).toBe(222);
    expect(result.timeline.freshnessStatus).toBe(FreshnessStatus.NEEDS_REVIEW);
  });

  it("uses referenceDate instead of device clock for correctness", () => {
    const referenceDate = "2026-08-01";
    const result = processFinancialTimeline({
      timeline: baseTimeline(),
      events: [],
      activities: [],
      settings: DEFAULT_FINANCIAL_TIMELINE_SETTINGS,
      referenceDate,
      nowIso: "2099-12-31T23:59:59.000Z"
    });

    expect(result.events.some((event) => compareCalendarDates(event.dueDate, referenceDate) <= 0)).toBe(
      true
    );
  });
});

describe("Financial Timeline confirmation strategies", () => {
  const pendingEvent: TimelineEvent = {
    id: "evt-pending",
    timelineId: "timeline-loan-test",
    sequenceNumber: 2,
    eventType: TimelineEventType.EMI,
    scheduledDate: "2026-07-05",
    dueDate: "2026-07-05",
    amount: 10_000,
    status: TimelineEventStatus.PENDING_CONFIRMATION,
    createdAt: NOW,
    updatedAt: NOW
  };

  it("manual strategy never auto-confirms", () => {
    const result = getConfirmationStrategy(ConfirmationMode.MANUAL).evaluate({
      timeline: baseTimeline(),
      events: [pendingEvent],
      referenceDate: "2026-07-21",
      confirmationMode: ConfirmationMode.MANUAL,
      smartAutoThreshold: 80
    });

    expect(result.autoConfirmEventIds).toHaveLength(0);
  });

  it("ask strategy surfaces review prompt for pending events", () => {
    const result = runConfirmationEngine({
      timeline: baseTimeline(),
      events: [pendingEvent],
      referenceDate: "2026-07-21",
      confirmationMode: ConfirmationMode.ASK_ME,
      smartAutoThreshold: 80
    });

    expect(result.reviewPrompt?.options).toContain("mark_all_paid");
    expect(result.autoConfirmEventIds).toHaveLength(0);
  });

  it("always auto confirms all pending events", () => {
    const result = runConfirmationEngine({
      timeline: baseTimeline(),
      events: [pendingEvent],
      referenceDate: "2026-07-21",
      confirmationMode: ConfirmationMode.ALWAYS_AUTO,
      smartAutoThreshold: 80
    });

    expect(result.autoConfirmEventIds).toEqual(["evt-pending"]);
  });

  it("smart auto requires high confidence for long absences", () => {
    const assessment = evaluateConfidence({
      timeline: baseTimeline({
        lastConfirmedState: {
          ...baseTimeline().lastConfirmedState,
          asOfDate: "2025-11-01"
        }
      }),
      events: Array.from({ length: 8 }, (_, index) => ({
        ...pendingEvent,
        id: `evt-${index}`,
        dueDate: addDays("2025-12-05", index * 30)
      })),
      referenceDate: "2026-07-21",
      confirmationMode: ConfirmationMode.SMART_AUTO,
      smartAutoThreshold: 80,
      historicalMissedCount: 2
    });

    expect(assessment.level).not.toBe("high");
    expect(assessment.score).toBeLessThan(80);

    const result = runConfirmationEngine({
      timeline: baseTimeline({
        lastConfirmedState: {
          ...baseTimeline().lastConfirmedState,
          asOfDate: "2025-11-01"
        }
      }),
      events: Array.from({ length: 8 }, (_, index) => ({
        ...pendingEvent,
        id: `evt-${index}`
      })),
      referenceDate: "2026-07-21",
      confirmationMode: ConfirmationMode.SMART_AUTO,
      smartAutoThreshold: 80,
      historicalMissedCount: 2
    });

    expect(result.autoConfirmEventIds).toHaveLength(0);
    expect(result.reviewPrompt).not.toBeNull();
  });
});

describe("Financial Timeline state derivation", () => {
  it("derives tenure only from confirmed events", () => {
    const seed = baseTimeline().lastConfirmedState;
    const confirmed: TimelineEvent = {
      id: "evt-confirmed",
      timelineId: "timeline-loan-test",
      sequenceNumber: 1,
      eventType: TimelineEventType.EMI,
      scheduledDate: "2026-07-05",
      dueDate: "2026-07-05",
      amount: 10_000,
      status: TimelineEventStatus.CONFIRMED,
      confirmedAt: NOW,
      createdAt: NOW,
      updatedAt: NOW
    };
    const pending: TimelineEvent = {
      ...confirmed,
      id: "evt-pending",
      sequenceNumber: 2,
      dueDate: "2026-08-05",
      status: TimelineEventStatus.PENDING_CONFIRMATION,
      confirmedAt: undefined
    };

    const withPendingOnly = deriveConfirmedProductState([pending], [], seed);
    expect(withPendingOnly.remainingTenureMonths).toBe(222);

    const withConfirmed = deriveConfirmedProductState([confirmed, pending], [], seed);
    expect(withConfirmed.remainingTenureMonths).toBe(221);
  });

  it("supports skipped and missed terminal states", () => {
    const baseEvent: TimelineEvent = {
      id: "evt-base",
      timelineId: "timeline-loan-test",
      sequenceNumber: 1,
      eventType: TimelineEventType.EMI,
      scheduledDate: "2026-07-05",
      dueDate: "2026-07-05",
      amount: 10_000,
      status: TimelineEventStatus.PENDING_CONFIRMATION,
      createdAt: NOW,
      updatedAt: NOW
    };

    const skipped = transitionTimelineEvent(baseEvent, TimelineEventStatus.SKIPPED, NOW);
    const missed = transitionTimelineEvent(baseEvent, TimelineEventStatus.MISSED, NOW);

    expect(skipped.status).toBe(TimelineEventStatus.SKIPPED);
    expect(missed.status).toBe(TimelineEventStatus.MISSED);
  });

  it("records manual confirmation as activity", () => {
    const event: TimelineEvent = {
      id: "evt-manual",
      timelineId: "timeline-loan-test",
      sequenceNumber: 1,
      eventType: TimelineEventType.EMI,
      scheduledDate: "2026-07-05",
      dueDate: "2026-07-05",
      amount: 10_000,
      status: TimelineEventStatus.PENDING_CONFIRMATION,
      createdAt: NOW,
      updatedAt: NOW
    };

    const { event: confirmed, activities } = confirmTimelineEvent({
      event,
      activities: [],
      activityId: "act-manual",
      nowIso: NOW
    });

    expect(confirmed.status).toBe(TimelineEventStatus.CONFIRMED);
    expect(activities).toHaveLength(1);
  });
});

describe("Financial Timeline freshness", () => {
  it("marks stale products after 6 months without confirmation", () => {
    const freshness = calculateFreshness(
      baseTimeline({
        lastConfirmedState: {
          ...baseTimeline().lastConfirmedState,
          asOfDate: "2025-12-01"
        }
      }),
      [],
      "2026-07-21"
    );

    expect(freshness.status).toBe(FreshnessStatus.STALE);
    expect(freshness.score).toBe(1);
  });

  it("flags needs review when multiple pending confirmations exist", () => {
    const events = Array.from({ length: 3 }, (_, index) => ({
      id: `evt-${index}`,
      timelineId: "timeline-loan-test",
      sequenceNumber: index + 1,
      eventType: TimelineEventType.EMI,
      scheduledDate: "2026-07-05",
      dueDate: addDays("2026-07-05", index * 30),
      amount: 10_000,
      status: TimelineEventStatus.PENDING_CONFIRMATION,
      createdAt: NOW,
      updatedAt: NOW
    }));

    const freshness = calculateFreshness(baseTimeline(), events, "2026-07-21");
    expect(freshness.status).toBe(FreshnessStatus.NEEDS_REVIEW);
  });
});

describe("Financial Timeline migration bootstrap", () => {
  it("bootstraps loan timeline from existing payments without data loss", () => {
    const loan = sampleLoan();
    const payments: LoanPayment[] = [
      {
        id: "pay-1",
        loanId: loan.id,
        kind: "emi",
        amount: 18_500,
        principalAmount: 12_000,
        interestAmount: 6_500,
        paidOn: "2026-06-05T00:00:00.000Z"
      },
      {
        id: "pay-2",
        loanId: loan.id,
        kind: "prepayment",
        amount: 100_000,
        principalAmount: 100_000,
        interestAmount: 0,
        paidOn: "2026-06-15T00:00:00.000Z"
      }
    ];

    const bundle = bootstrapTimelineFromLoan({ loan, payments, nowIso: NOW });

    expect(bundle.timeline.productId).toBe(loan.id);
    expect(bundle.timeline.lastConfirmedState.outstandingBalance).toBe(loan.outstandingBalance);
    expect(bundle.events).toHaveLength(2);
    expect(bundle.activities.some((activity) => activity.kind === "prepayment")).toBe(true);
  });
});

describe("Financial Timeline performance", () => {
  it("processes thousands of scheduled events within acceptable time", () => {
    const timeline = baseTimeline({
      schedule: {
        frequency: RecurrenceFrequency.MONTHLY,
        startDate: "2010-01-05",
        dueDayOfMonth: 5,
        installmentCount: 360,
        amount: 10_000,
        eventType: TimelineEventType.EMI
      },
      lastConfirmedState: {
        ...baseTimeline().lastConfirmedState,
        asOfDate: "2010-01-05"
      }
    });

    const started = performance.now();
    const result = processFinancialTimeline({
      timeline,
      events: [],
      activities: [],
      settings: DEFAULT_FINANCIAL_TIMELINE_SETTINGS,
      referenceDate: "2026-07-21",
      nowIso: NOW
    });
    const elapsed = performance.now() - started;

    expect(result.events.length).toBeGreaterThan(100);
    expect(elapsed).toBeLessThan(2000);
  });
});
