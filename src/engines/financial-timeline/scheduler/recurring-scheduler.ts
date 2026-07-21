import {
  RecurrenceFrequency,
  TimelineEventStatus,
  TimelineEventType,
  type RecurrenceFrequencyValue,
  type RecurringSchedule,
  type TimelineEvent,
  type TimelineEventTypeValue
} from "@/shared/domain/financial-timeline";
import {
  addDays,
  addMonthsPreservingDueDay,
  compareCalendarDates,
  parseCalendarDate
} from "@/engines/financial-timeline/scheduler/date-utils";

export interface GenerateExpectedEventsInput {
  timelineId: string;
  schedule: RecurringSchedule;
  fromDate: string;
  toDate: string;
  startingSequence: number;
  referenceNow?: string;
}

function monthsForFrequency(frequency: RecurrenceFrequencyValue): number {
  switch (frequency) {
    case RecurrenceFrequency.MONTHLY:
      return 1;
    case RecurrenceFrequency.QUARTERLY:
      return 3;
    case RecurrenceFrequency.HALF_YEARLY:
      return 6;
    case RecurrenceFrequency.YEARLY:
      return 12;
    default:
      return 1;
  }
}

function nextOccurrenceDate(currentDueDate: string, schedule: RecurringSchedule): string {
  if (schedule.frequency === RecurrenceFrequency.WEEKLY) {
    return addDays(currentDueDate, 7);
  }

  if (schedule.frequency === RecurrenceFrequency.CUSTOM) {
    return addDays(currentDueDate, schedule.customIntervalDays ?? 30);
  }

  const dueDay = schedule.dueDayOfMonth ?? parseCalendarDate(currentDueDate).getDate();
  return addMonthsPreservingDueDay(currentDueDate, monthsForFrequency(schedule.frequency), dueDay);
}

function initialDueDate(schedule: RecurringSchedule): string {
  if (schedule.dueDayOfMonth) {
    const start = parseCalendarDate(schedule.startDate);
    return addMonthsPreservingDueDay(
      schedule.startDate,
      0,
      schedule.dueDayOfMonth ?? start.getDate()
    );
  }

  return schedule.startDate;
}

export function generateExpectedTimelineEvents(
  input: GenerateExpectedEventsInput
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const nowIso = input.referenceNow ?? new Date().toISOString();
  let sequence = input.startingSequence;
  let dueDate = initialDueDate(input.schedule);
  let generated = 0;
  const maxEvents = input.schedule.installmentCount ?? 600;

  while (
    compareCalendarDates(dueDate, input.toDate) <= 0 &&
    generated < maxEvents &&
    (!input.schedule.endDate || compareCalendarDates(dueDate, input.schedule.endDate) <= 0)
  ) {
    if (compareCalendarDates(dueDate, input.fromDate) >= 0) {
      const status =
        compareCalendarDates(dueDate, input.toDate) < 0
          ? TimelineEventStatus.PENDING_CONFIRMATION
          : compareCalendarDates(dueDate, input.toDate) === 0
            ? TimelineEventStatus.DUE
            : TimelineEventStatus.SCHEDULED;

      events.push({
        id: `${input.timelineId}-evt-${sequence}`,
        timelineId: input.timelineId,
        sequenceNumber: sequence,
        eventType: input.schedule.eventType,
        scheduledDate: dueDate,
        dueDate,
        amount: input.schedule.amount,
        status,
        createdAt: nowIso,
        updatedAt: nowIso
      });
      sequence += 1;
      generated += 1;
    }

    dueDate = nextOccurrenceDate(dueDate, input.schedule);
  }

  return events;
}

export function buildLoanEmiSchedule(params: {
  startDate: string;
  emiPaymentDay: number;
  monthlyEmi: number;
  remainingTenureMonths: number;
}): RecurringSchedule {
  return {
    frequency: RecurrenceFrequency.MONTHLY,
    startDate: params.startDate,
    dueDayOfMonth: params.emiPaymentDay,
    installmentCount: params.remainingTenureMonths,
    amount: params.monthlyEmi,
    eventType: TimelineEventType.EMI
  };
}

export function buildChitContributionSchedule(params: {
  startDate: string;
  dueDayOfMonth: number;
  monthlyContribution: number;
  remainingMonths: number;
}): RecurringSchedule {
  return {
    frequency: RecurrenceFrequency.MONTHLY,
    startDate: params.startDate,
    dueDayOfMonth: params.dueDayOfMonth,
    installmentCount: params.remainingMonths,
    amount: params.monthlyContribution,
    eventType: TimelineEventType.CONTRIBUTION
  };
}

export function resolveEventTypeForProduct(
  productTypeId: string,
  loanType?: string
): TimelineEventTypeValue {
  if (loanType === "gold") {
    return TimelineEventType.RENEWAL;
  }

  if (productTypeId === "chits") {
    return TimelineEventType.CONTRIBUTION;
  }

  return TimelineEventType.EMI;
}
