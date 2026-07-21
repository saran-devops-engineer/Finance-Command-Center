import type { FinancialTimeline, TimelineEvent } from "@/shared/domain/financial-timeline";
import { daysBetween } from "@/engines/financial-timeline/scheduler/date-utils";
import {
  NotificationPriority,
  NotificationType,
  type NotificationCandidate,
  type NotificationTypeValue,
  type FinancialNotificationSettings
} from "@/notifications/models";

export interface NotificationRulesInput {
  timelines: FinancialTimeline[];
  events: TimelineEvent[];
  referenceDate: string;
  settings: FinancialNotificationSettings;
}

function resolveProductLabel(timeline: FinancialTimeline): string {
  const snapshot = timeline.lastConfirmedState.snapshot;
  if (typeof snapshot.lender === "string") {
    return snapshot.lender as string;
  }
  if (typeof snapshot.chitName === "string") {
    return snapshot.chitName as string;
  }
  return "Financial product";
}

function resolveNotificationType(offsetDays: number, eventStatus: TimelineEvent["status"]): NotificationTypeValue {
  if (eventStatus === "missed") {
    return NotificationType.MISSED_CONFIRMATION;
  }

  if (eventStatus === "pending_confirmation") {
    return NotificationType.PENDING_CONFIRMATION;
  }

  if (offsetDays < 0) {
    return NotificationType.OVERDUE;
  }

  if (offsetDays === 0) {
    return NotificationType.DUE_TODAY;
  }

  if (offsetDays === 1) {
    return NotificationType.DUE_TOMORROW;
  }

  return NotificationType.UPCOMING_DUE;
}

function resolvePriority(type: NotificationTypeValue): NotificationCandidate["priority"] {
  if (type === NotificationType.OVERDUE || type === NotificationType.MISSED_CONFIRMATION) {
    return NotificationPriority.CRITICAL;
  }

  if (type === NotificationType.DUE_TODAY || type === NotificationType.PENDING_CONFIRMATION) {
    return NotificationPriority.HIGH;
  }

  return NotificationPriority.NORMAL;
}

function isEligibleEvent(event: TimelineEvent): boolean {
  return (
    event.status === "scheduled" ||
    event.status === "due" ||
    event.status === "pending_confirmation" ||
    event.status === "missed"
  );
}

export function generateNotificationCandidates(input: NotificationRulesInput): NotificationCandidate[] {
  const timelineById = new Map(input.timelines.map((timeline) => [timeline.id, timeline]));
  const candidates: NotificationCandidate[] = [];

  for (const event of input.events) {
    if (!isEligibleEvent(event)) {
      continue;
    }

    const timeline = timelineById.get(event.timelineId);
    if (!timeline || timeline.status !== "active") {
      continue;
    }

    const daysUntilDue = daysBetween(input.referenceDate, event.dueDate);

    if (event.status === "pending_confirmation" || event.status === "missed") {
      const type = resolveNotificationType(daysUntilDue, event.status);
      if (!input.settings.categoryEnabled[type]) {
        continue;
      }

      candidates.push({
        fingerprint: `${event.id}:${type}:status`,
        notificationType: type,
        timelineId: event.timelineId,
        sourceEventId: event.id,
        productTypeId: timeline.productTypeId,
        productId: timeline.productId,
        productLabel: resolveProductLabel(timeline),
        eventType: event.eventType,
        eventStatus: event.status,
        dueDate: event.dueDate,
        amount: event.amount,
        scheduledDeliveryDate: input.referenceDate,
        priority: resolvePriority(type),
        reminderOffsetDays: daysUntilDue
      });
      continue;
    }

    for (const offset of input.settings.reminderOffsetsDays) {
      if (daysUntilDue !== offset) {
        continue;
      }

      const type = resolveNotificationType(offset, event.status);
      if (!input.settings.categoryEnabled[type]) {
        continue;
      }

      candidates.push({
        fingerprint: `${event.id}:${type}:${offset}`,
        notificationType: type,
        timelineId: event.timelineId,
        sourceEventId: event.id,
        productTypeId: timeline.productTypeId,
        productId: timeline.productId,
        productLabel: resolveProductLabel(timeline),
        eventType: event.eventType,
        eventStatus: event.status,
        dueDate: event.dueDate,
        amount: event.amount,
        scheduledDeliveryDate: input.referenceDate,
        priority: resolvePriority(type),
        reminderOffsetDays: offset
      });
    }

    if (daysUntilDue < 0) {
      const type = NotificationType.OVERDUE;
      if (!input.settings.categoryEnabled[type]) {
        continue;
      }

      candidates.push({
        fingerprint: `${event.id}:${type}:overdue`,
        notificationType: type,
        timelineId: event.timelineId,
        sourceEventId: event.id,
        productTypeId: timeline.productTypeId,
        productId: timeline.productId,
        productLabel: resolveProductLabel(timeline),
        eventType: event.eventType,
        eventStatus: event.status,
        dueDate: event.dueDate,
        amount: event.amount,
        scheduledDeliveryDate: input.referenceDate,
        priority: NotificationPriority.CRITICAL,
        reminderOffsetDays: daysUntilDue
      });
    }
  }

  return candidates;
}
