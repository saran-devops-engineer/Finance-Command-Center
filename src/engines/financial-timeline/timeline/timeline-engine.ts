import {
  TimelineActivityKind,
  type FinancialTimeline,
  type FinancialTimelineSettings,
  type LastConfirmedState,
  type TimelineActivity,
  type TimelineDashboardSummary,
  type TimelineEvent
} from "@/shared/domain/financial-timeline";
import {
  appendTimelineActivity,
  createEventConfirmedActivity
} from "@/engines/financial-timeline/activity/activity-log";
import { runConfirmationEngine } from "@/engines/financial-timeline/confirmation/confirmation-engine";
import { calculateFreshness } from "@/engines/financial-timeline/freshness/freshness-calculator";
import { generateExpectedTimelineEvents } from "@/engines/financial-timeline/scheduler/recurring-scheduler";
import { daysBetween } from "@/engines/financial-timeline/scheduler/date-utils";
import { resolveConfirmationMode } from "@/engines/financial-timeline/settings/defaults";
import {
  countConfirmedEvents,
  countPendingConfirmations,
  deriveConfirmedProductState
} from "@/engines/financial-timeline/state/state-manager";
import {
  advanceAllTimelineEvents,
  transitionTimelineEvent
} from "@/engines/financial-timeline/timeline/event-transition";

export interface TimelineEngineInput {
  timeline: FinancialTimeline;
  events: TimelineEvent[];
  activities: TimelineActivity[];
  settings: FinancialTimelineSettings;
  referenceDate: string;
  nowIso?: string;
}

export interface TimelineEngineResult {
  timeline: FinancialTimeline;
  events: TimelineEvent[];
  activities: TimelineActivity[];
  confirmedState: ReturnType<typeof deriveConfirmedProductState>;
  dashboard: TimelineDashboardSummary;
}

export function processFinancialTimeline(input: TimelineEngineInput): TimelineEngineResult {
  const nowIso = input.nowIso ?? new Date().toISOString();
  const confirmationMode = resolveConfirmationMode(
    input.settings,
    input.timeline.confirmationMode
  );

  let events = advanceAllTimelineEvents(input.events, input.referenceDate, nowIso);

  const existingDueDates = new Set(events.map((event) => event.dueDate));
  const generated = generateExpectedTimelineEvents({
    timelineId: input.timeline.id,
    schedule: input.timeline.schedule,
    fromDate: input.timeline.lastConfirmedState.asOfDate,
    toDate: input.referenceDate,
    startingSequence: events.length + 1,
    referenceNow: nowIso
  }).filter((event) => !existingDueDates.has(event.dueDate));

  events = [...events, ...generated];
  events = advanceAllTimelineEvents(events, input.referenceDate, nowIso);

  const confirmation = runConfirmationEngine({
    timeline: input.timeline,
    events,
    referenceDate: input.referenceDate,
    confirmationMode,
    smartAutoThreshold: input.settings.smartAutoThreshold
  });

  let activities = input.activities;

  if (confirmation.autoConfirmEventIds.length > 0) {
    events = events.map((event) => {
      if (!confirmation.autoConfirmEventIds.includes(event.id)) {
        return event;
      }

      const confirmed = transitionTimelineEvent(event, "confirmed", nowIso);
      activities = appendTimelineActivity(
        activities,
        createEventConfirmedActivity(confirmed, `${confirmed.id}-act`, nowIso)
      );
      return confirmed;
    });
  }

  const freshness = calculateFreshness(input.timeline, events, input.referenceDate);
  const lastConfirmedState = buildLastConfirmedState(input.timeline.lastConfirmedState, events, nowIso);

  const timeline: FinancialTimeline = {
    ...input.timeline,
    lastConfirmedState,
    freshnessStatus: freshness.status,
    freshnessScore: freshness.score,
    updatedAt: nowIso
  };

  const confirmedState = deriveConfirmedProductState(events, activities, lastConfirmedState);

  const dashboard: TimelineDashboardSummary = {
    confirmedCount: countConfirmedEvents(events),
    pendingConfirmationCount: countPendingConfirmations(events),
    missedCount: events.filter((event) => event.status === "missed").length,
    lastUpdatedLabel: formatLastUpdatedLabel(lastConfirmedState.asOfDate, input.referenceDate),
    needsReview:
      freshness.status === "needs_review" ||
      freshness.status === "needs_attention" ||
      freshness.status === "stale" ||
      countPendingConfirmations(events) > 0
  };

  return {
    timeline,
    events,
    activities,
    confirmedState,
    dashboard
  };
}

function buildLastConfirmedState(
  seed: LastConfirmedState,
  events: TimelineEvent[],
  nowIso: string
): LastConfirmedState {
  const latestConfirmed = [...events]
    .filter((event) => event.status === "confirmed")
    .sort((a, b) => new Date(b.confirmedAt ?? b.dueDate).getTime() - new Date(a.confirmedAt ?? a.dueDate).getTime())[0];

  if (!latestConfirmed) {
    return seed;
  }

  return {
    confirmedAt: latestConfirmed.confirmedAt ?? nowIso,
    confirmedActivityId: latestConfirmed.confirmedActivityId ?? seed.confirmedActivityId,
    asOfDate: latestConfirmed.dueDate,
    outstandingBalance:
      typeof latestConfirmed.metadata?.outstandingBalanceAfter === "number"
        ? latestConfirmed.metadata.outstandingBalanceAfter
        : seed.outstandingBalance,
    remainingTenureMonths:
      typeof latestConfirmed.metadata?.remainingTenureMonthsAfter === "number"
        ? latestConfirmed.metadata.remainingTenureMonthsAfter
        : seed.remainingTenureMonths,
    snapshot: {
      ...seed.snapshot,
      lastConfirmedEventId: latestConfirmed.id
    }
  };
}

function formatLastUpdatedLabel(asOfDate: string, referenceDate: string): string {
  const days = daysBetween(asOfDate, referenceDate);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days <= 7) return `${days} days ago`;
  return asOfDate;
}

export function confirmTimelineEvent(params: {
  event: TimelineEvent;
  activities: TimelineActivity[];
  activityId: string;
  nowIso: string;
  stateDelta?: Record<string, unknown>;
}): { event: TimelineEvent; activities: TimelineActivity[] } {
  const confirmed = transitionTimelineEvent(params.event, "confirmed", params.nowIso);
  confirmed.confirmedActivityId = params.activityId;

  const activities = appendTimelineActivity(params.activities, {
    id: params.activityId,
    timelineId: confirmed.timelineId,
    kind: TimelineActivityKind.EVENT_CONFIRMED,
    title: "Payment confirmed",
    occurredAt: params.nowIso,
    eventId: confirmed.id,
    stateDelta: params.stateDelta,
    createdAt: params.nowIso
  });

  return { event: confirmed, activities };
}
