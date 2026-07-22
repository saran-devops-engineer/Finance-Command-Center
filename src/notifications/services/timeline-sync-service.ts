import type { FinanceRepository } from "@/core/repository/finance-repository";
import type {
  FinancialNotification,
  FinancialNotificationSettings,
  NotificationHistoryEntry
} from "@/notifications/models";
import { NOTIFICATION_SETTINGS_ID } from "@/notifications/models";
import {
  DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS,
  normalizeNotificationSettings
} from "@/notifications/settings/defaults";
import {
  deliverDeviceNotificationsViaManager,
  processFinancialNotifications
} from "@/notifications/core/financial-notification-system";
import { trimNotificationHistory } from "@/notifications/history/notification-history";

export interface SyncFinancialNotificationsResult {
  queue: FinancialNotification[];
  history: NotificationHistoryEntry[];
  candidatesGenerated: number;
  newlyQueued: number;
  deliveredCount: number;
}

export async function syncFinancialNotificationsFromTimeline(
  repository: FinanceRepository,
  referenceDate?: string,
  nowIso?: string
): Promise<SyncFinancialNotificationsResult> {
  const reference = referenceDate ?? new Date().toISOString().slice(0, 10);
  const now = nowIso ?? new Date().toISOString();

  const [timelines, settingsRecord, existingQueue, history] = await Promise.all([
    repository.listFinancialTimelines(),
    repository.getNotificationSettings(),
    repository.listNotificationQueue(),
    repository.listNotificationHistory()
  ]);

  const settings = normalizeNotificationSettings(
    settingsRecord ?? {
      ...DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS,
      updatedAt: now
    }
  );

  const events = (
    await Promise.all(timelines.map((timeline) => repository.listTimelineEvents(timeline.id)))
  ).flat();

  const processed = processFinancialNotifications({
    timelines,
    events,
    referenceDate: reference,
    settings,
    existingQueue,
    history,
    nowIso: now
  });

  const delivered = deliverDeviceNotificationsViaManager({
    queue: processed.queue,
    history: processed.history,
    settings,
    referenceIso: now
  });

  const trimmedHistory = trimNotificationHistory(delivered.history, 5000);

  await Promise.all([
    repository.saveNotificationQueue(delivered.queue),
    repository.saveNotificationHistory(trimmedHistory),
    repository.saveNotificationSettings(settings)
  ]);

  return {
    queue: delivered.queue,
    history: trimmedHistory,
    candidatesGenerated: processed.candidatesGenerated,
    newlyQueued: processed.newlyQueued,
    deliveredCount: delivered.deliveredCount
  };
}

export async function loadNotificationSettings(
  repository: FinanceRepository
): Promise<FinancialNotificationSettings> {
  const settings = await repository.getNotificationSettings();
  return normalizeNotificationSettings(settings);
}

export async function ensureNotificationSettings(
  repository: FinanceRepository
): Promise<FinancialNotificationSettings> {
  const existing = await repository.getNotificationSettings();
  if (existing) {
    return normalizeNotificationSettings(existing);
  }

  const settings = normalizeNotificationSettings({
    ...DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS,
    updatedAt: new Date().toISOString()
  });
  await repository.saveNotificationSettings(settings);
  return settings;
}

export { NOTIFICATION_SETTINGS_ID };
