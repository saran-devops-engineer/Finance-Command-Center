import {
  TimelineActivityKind,
  type TimelineActivity,
  type TimelineActivityKindValue,
  type TimelineEvent
} from "@/shared/domain/financial-timeline";

export interface AppendTimelineActivityInput {
  id: string;
  timelineId: string;
  kind: TimelineActivityKindValue;
  title: string;
  description?: string;
  occurredAt: string;
  eventId?: string;
  stateDelta?: Record<string, unknown>;
  createdAt: string;
}

export function appendTimelineActivity(
  activities: TimelineActivity[],
  input: AppendTimelineActivityInput
): TimelineActivity[] {
  return [
    ...activities,
    {
      id: input.id,
      timelineId: input.timelineId,
      kind: input.kind,
      title: input.title,
      description: input.description,
      occurredAt: input.occurredAt,
      eventId: input.eventId,
      stateDelta: input.stateDelta,
      createdAt: input.createdAt
    }
  ];
}

export function sortActivitiesNewestFirst(activities: TimelineActivity[]): TimelineActivity[] {
  return [...activities].sort(
    (first, second) =>
      new Date(second.occurredAt).getTime() - new Date(first.occurredAt).getTime()
  );
}

export function createEventConfirmedActivity(
  event: TimelineEvent,
  activityId: string,
  nowIso: string
): AppendTimelineActivityInput {
  return {
    id: activityId,
    timelineId: event.timelineId,
    kind: TimelineActivityKind.EVENT_CONFIRMED,
    title: `${event.eventType.toUpperCase()} confirmed`,
    description: `Confirmed scheduled event due ${event.dueDate}`,
    occurredAt: nowIso,
    eventId: event.id,
    stateDelta: {
      amount: event.amount,
      dueDate: event.dueDate
    },
    createdAt: nowIso
  };
}

export function deriveActivityTimeline(activities: TimelineActivity[]): TimelineActivity[] {
  return sortActivitiesNewestFirst(activities);
}
