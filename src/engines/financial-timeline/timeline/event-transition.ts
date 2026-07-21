import {
  assertTimelineEventTransition,
  TimelineEventStatus,
  type TimelineEvent,
  type TimelineEventStatusValue
} from "@/shared/domain/financial-timeline";
import { compareCalendarDates } from "@/engines/financial-timeline/scheduler/date-utils";

export function advanceTimelineEventStatus(
  event: TimelineEvent,
  referenceDate: string,
  nowIso: string
): TimelineEvent {
  if (
    event.status === TimelineEventStatus.SCHEDULED &&
    compareCalendarDates(referenceDate, event.dueDate) >= 0
  ) {
    return transitionTimelineEvent(event, TimelineEventStatus.DUE, nowIso);
  }

  if (
    event.status === TimelineEventStatus.DUE &&
    compareCalendarDates(referenceDate, event.dueDate) > 0
  ) {
    return transitionTimelineEvent(event, TimelineEventStatus.PENDING_CONFIRMATION, nowIso);
  }

  return event;
}

export function transitionTimelineEvent(
  event: TimelineEvent,
  nextStatus: TimelineEventStatusValue,
  nowIso: string
): TimelineEvent {
  assertTimelineEventTransition(event.status, nextStatus);

  const next: TimelineEvent = {
    ...event,
    status: nextStatus,
    updatedAt: nowIso
  };

  if (nextStatus === TimelineEventStatus.CONFIRMED) {
    next.confirmedAt = nowIso;
  }

  if (nextStatus === TimelineEventStatus.SKIPPED) {
    next.skippedAt = nowIso;
  }

  if (nextStatus === TimelineEventStatus.MISSED) {
    next.missedAt = nowIso;
  }

  return next;
}

export function advanceAllTimelineEvents(
  events: TimelineEvent[],
  referenceDate: string,
  nowIso: string
): TimelineEvent[] {
  return events.map((event) => advanceTimelineEventStatus(event, referenceDate, nowIso));
}
