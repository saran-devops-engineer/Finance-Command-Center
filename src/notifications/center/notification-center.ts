import {
  NotificationQueueStatus,
  type FinancialNotification,
  type NotificationCenterSummary
} from "@/notifications/models";
import { buildNotificationCenterSummary } from "@/notifications/core/financial-notification-system";

export type NotificationCenterFilter = "all" | "unread" | "snoozed" | "history";

export function filterNotifications(
  queue: FinancialNotification[],
  filter: NotificationCenterFilter
): FinancialNotification[] {
  switch (filter) {
    case "unread":
      return queue.filter(
        (item) =>
          item.status === NotificationQueueStatus.QUEUED ||
          item.status === NotificationQueueStatus.SCHEDULED ||
          item.status === NotificationQueueStatus.DELIVERED ||
          item.status === NotificationQueueStatus.GENERATED
      );
    case "snoozed":
      return queue.filter((item) => item.status === NotificationQueueStatus.SNOOZED);
    case "history":
      return queue.filter((item) =>
        item.status === NotificationQueueStatus.OPENED ||
        item.status === NotificationQueueStatus.DISMISSED ||
        item.status === NotificationQueueStatus.DELIVERED ||
        item.status === NotificationQueueStatus.EXPIRED ||
        item.status === NotificationQueueStatus.FAILED
      );
    default:
      return queue.filter((item) => item.status !== NotificationQueueStatus.CANCELLED);
  }
}

export function searchNotifications(
  queue: FinancialNotification[],
  query: string
): FinancialNotification[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return queue;
  }

  return queue.filter(
    (item) =>
      item.title.toLowerCase().includes(normalized) ||
      item.body.toLowerCase().includes(normalized) ||
      item.productLabel.toLowerCase().includes(normalized)
  );
}

export function summarizeNotificationCenter(queue: FinancialNotification[]): NotificationCenterSummary {
  return buildNotificationCenterSummary(queue);
}

export function sortCenterNotifications(queue: FinancialNotification[]): FinancialNotification[] {
  return [...queue].sort(
    (first, second) =>
      new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime()
  );
}
