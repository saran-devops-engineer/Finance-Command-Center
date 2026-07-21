import type { NotificationHistoryEntry } from "@/notifications/models";

export function trimNotificationHistory(
  history: NotificationHistoryEntry[],
  maxEntries: number
): NotificationHistoryEntry[] {
  if (history.length <= maxEntries) {
    return history;
  }

  return [...history]
    .sort((first, second) => new Date(second.occurredAt).getTime() - new Date(first.occurredAt).getTime())
    .slice(0, maxEntries);
}

export function countHistoryByStatus(
  history: NotificationHistoryEntry[],
  status: NotificationHistoryEntry["status"]
): number {
  return history.filter((entry) => entry.status === status).length;
}
