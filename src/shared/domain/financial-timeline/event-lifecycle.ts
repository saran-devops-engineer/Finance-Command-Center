import {
  TimelineEventStatus,
  type TimelineEventStatusValue
} from "@/shared/domain/financial-timeline/types";

/** Legal transitions — events never jump directly from scheduled to confirmed. */
export const TIMELINE_EVENT_TRANSITIONS: Record<
  TimelineEventStatusValue,
  readonly TimelineEventStatusValue[]
> = {
  [TimelineEventStatus.SCHEDULED]: [TimelineEventStatus.DUE],
  [TimelineEventStatus.DUE]: [TimelineEventStatus.PENDING_CONFIRMATION],
  [TimelineEventStatus.PENDING_CONFIRMATION]: [
    TimelineEventStatus.CONFIRMED,
    TimelineEventStatus.SKIPPED,
    TimelineEventStatus.MISSED
  ],
  [TimelineEventStatus.CONFIRMED]: [],
  [TimelineEventStatus.SKIPPED]: [],
  [TimelineEventStatus.MISSED]: []
};

export function canTransitionTimelineEvent(
  from: TimelineEventStatusValue,
  to: TimelineEventStatusValue
): boolean {
  return TIMELINE_EVENT_TRANSITIONS[from].includes(to);
}

export function assertTimelineEventTransition(
  from: TimelineEventStatusValue,
  to: TimelineEventStatusValue
): void {
  if (!canTransitionTimelineEvent(from, to)) {
    throw new Error(`Invalid timeline event transition: ${from} → ${to}`);
  }
}

export function isTerminalTimelineEventStatus(status: TimelineEventStatusValue): boolean {
  return (
    status === TimelineEventStatus.CONFIRMED ||
    status === TimelineEventStatus.SKIPPED ||
    status === TimelineEventStatus.MISSED
  );
}

export function isConfirmedTimelineEventStatus(status: TimelineEventStatusValue): boolean {
  return status === TimelineEventStatus.CONFIRMED;
}
