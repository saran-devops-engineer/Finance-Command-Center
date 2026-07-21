import {
  isConfirmedTimelineEventStatus,
  type LastConfirmedState,
  type TimelineActivity,
  type TimelineEvent
} from "@/shared/domain/financial-timeline";

export interface ConfirmedProductState {
  asOfDate: string;
  outstandingBalance?: number;
  remainingTenureMonths?: number;
  confirmedEventCount: number;
  snapshot: Record<string, unknown>;
}

/** Calculations must ONLY use confirmed events — pending events are excluded. */
export function deriveConfirmedProductState(
  events: TimelineEvent[],
  activities: TimelineActivity[],
  seed: LastConfirmedState
): ConfirmedProductState {
  const confirmedEvents = events.filter((event) => isConfirmedTimelineEventStatus(event.status));

  let outstandingBalance = seed.outstandingBalance;
  let remainingTenureMonths = seed.remainingTenureMonths;
  let asOfDate = seed.asOfDate;

  for (const event of confirmedEvents.sort(
    (a, b) => new Date(a.confirmedAt ?? a.dueDate).getTime() - new Date(b.confirmedAt ?? b.dueDate).getTime()
  )) {
    asOfDate = event.dueDate;

    if (typeof event.metadata?.outstandingBalanceAfter === "number") {
      outstandingBalance = event.metadata.outstandingBalanceAfter;
    }

    if (typeof event.metadata?.remainingTenureMonthsAfter === "number") {
      remainingTenureMonths = event.metadata.remainingTenureMonthsAfter;
    } else if (event.eventType === "emi" && remainingTenureMonths !== undefined) {
      remainingTenureMonths = Math.max(0, remainingTenureMonths - 1);
    }
  }

  const latestActivity = [...activities].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  )[0];

  return {
    asOfDate,
    outstandingBalance,
    remainingTenureMonths,
    confirmedEventCount: confirmedEvents.length,
    snapshot: {
      ...seed.snapshot,
      lastActivityKind: latestActivity?.kind,
      lastActivityAt: latestActivity?.occurredAt
    }
  };
}

export function countPendingConfirmations(events: TimelineEvent[]): number {
  return events.filter((event) => event.status === "pending_confirmation").length;
}

export function countConfirmedEvents(events: TimelineEvent[]): number {
  return events.filter((event) => isConfirmedTimelineEventStatus(event.status)).length;
}
