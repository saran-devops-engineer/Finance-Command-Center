import type { FinanceRepository } from "@/core/repository/finance-repository";
import {
  getEnvironmentLabel,
  resolveAppEnvironment
} from "@/core/configuration/environment";
import {
  NotificationActionType,
  NotificationQueueStatus,
  type FinancialNotification,
  type NotificationHistoryEntry
} from "@/notifications/models";
import {
  DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS,
  normalizeNotificationSettings
} from "@/notifications/settings/defaults";
import {
  deliverDeviceNotificationsViaManager,
  handleNotificationAction,
  processFinancialNotifications
} from "@/notifications/core/financial-notification-system";
import { getNotificationProviderManager } from "@/notifications/manager/provider-manager";
import { detectPlatformCapabilities } from "@/notifications/manager/platform-detection";
import { syncFinancialNotificationsFromTimeline } from "@/notifications/services/timeline-sync-service";
import {
  buildBulkTestFixtures,
  buildGroupingTestFixtures,
  buildNotificationTestFixture,
  type NotificationTestScenario
} from "@/notifications/testing/fixtures";
import {
  createNotificationTestId,
  isNotificationTestId,
  NOTIFICATION_TEST_PREFIX
} from "@/notifications/testing/constants";
import {
  getSimulatedReferenceIso,
  isOfflineSimulationEnabled,
  readNotificationTestSessionMeta,
  recordNotificationTestDelivery,
  recordNotificationTestError,
  setOfflineSimulationEnabled,
  setSimulatedReferenceIso,
  setUnsupportedSimulationEnabled,
  clearNotificationTestingSessionState
} from "@/notifications/testing/testing-overrides";

export interface NotificationTestingDiagnostics {
  environment: string;
  notificationApiSupported: boolean;
  notificationPermission: NotificationPermission | "unsupported";
  browser: string;
  pwaInstalled: boolean;
  providerSelected: string;
  queueSize: number;
  pendingNotifications: number;
  failedNotifications: number;
  lastDeliveryTime: string | null;
  lastError: string | null;
  offlineSimulation: boolean;
  unsupportedSimulation: boolean;
  simulatedReferenceIso: string | null;
}

export interface NotificationTestingStatus {
  permission: NotificationPermission | "unsupported";
  currentProvider: string;
  notificationCenterEnabled: boolean;
  serviceWorkerStatus: string;
  lastNotificationTime: string | null;
}

export interface NotificationTestingHistoryCounts {
  generated: number;
  queued: number;
  delivered: number;
  opened: number;
  dismissed: number;
  snoozed: number;
  expired: number;
  failed: number;
}

function resolveReferenceIso(nowIso = new Date().toISOString()): string {
  return getSimulatedReferenceIso() ?? nowIso;
}

function resolveReferenceDate(nowIso = new Date().toISOString()): string {
  return resolveReferenceIso(nowIso).slice(0, 10);
}

function isTestNotification(item: { id: string; timelineId: string; fingerprint: string }): boolean {
  return (
    isNotificationTestId(item.id) ||
    isNotificationTestId(item.timelineId) ||
    item.fingerprint.includes(NOTIFICATION_TEST_PREFIX)
  );
}

function isTestHistoryEntry(entry: NotificationHistoryEntry, testNotificationIds: Set<string>): boolean {
  return (
    isNotificationTestId(entry.notificationId) ||
    isNotificationTestId(entry.id) ||
    testNotificationIds.has(entry.notificationId)
  );
}

async function ensureNotificationsEnabledForTesting(repository: FinanceRepository) {
  const settings = normalizeNotificationSettings(await repository.getNotificationSettings());
  if (settings.enabled) {
    return settings;
  }

  const manager = getNotificationProviderManager();
  const enabled = await manager.enableNotifications(settings);
  await repository.saveNotificationSettings(enabled.settings);
  return enabled.settings;
}

async function persistTestFixtures(
  repository: FinanceRepository,
  fixtures: ReturnType<typeof buildNotificationTestFixture>[]
) {
  await Promise.all(
    fixtures.flatMap((fixture) => [
      repository.saveFinancialTimeline(fixture.timeline),
      repository.saveTimelineEvents([fixture.event])
    ])
  );
}

export async function getNotificationTestingStatus(
  repository: FinanceRepository
): Promise<NotificationTestingStatus> {
  const platform = detectPlatformCapabilities();
  const settings = normalizeNotificationSettings(await repository.getNotificationSettings());
  const manager = getNotificationProviderManager();
  const provider = manager.selectDeviceProvider() ?? manager.selectBestProvider();
  const meta = readNotificationTestSessionMeta();

  return {
    permission: platform.notificationPermission,
    currentProvider: provider.id,
    notificationCenterEnabled: settings.capabilities.notificationCenter,
    serviceWorkerStatus: platform.hasServiceWorker ? "Supported (push future)" : "Not available",
    lastNotificationTime: meta.lastNotificationTime
  };
}

export async function getNotificationTestingDiagnostics(
  repository: FinanceRepository
): Promise<NotificationTestingDiagnostics> {
  const platform = detectPlatformCapabilities();
  const settings = normalizeNotificationSettings(await repository.getNotificationSettings());
  const manager = getNotificationProviderManager();
  const provider = manager.selectBestProvider();
  const queue = await repository.listNotificationQueue();
  const meta = readNotificationTestSessionMeta();

  const testQueue = queue.filter(isTestNotification);
  const pending = testQueue.filter(
    (item) =>
      item.status === NotificationQueueStatus.QUEUED ||
      item.status === NotificationQueueStatus.SCHEDULED ||
      item.status === NotificationQueueStatus.GENERATED
  ).length;
  const failed = testQueue.filter((item) => item.status === NotificationQueueStatus.FAILED).length;

  return {
    environment: getEnvironmentLabel(resolveAppEnvironment()),
    notificationApiSupported: platform.hasNotificationApi,
    notificationPermission: platform.notificationPermission,
    browser: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    pwaInstalled: platform.isInstalledPwa,
    providerSelected: provider.id,
    queueSize: testQueue.length,
    pendingNotifications: pending,
    failedNotifications: failed,
    lastDeliveryTime: meta.lastDeliveryTime,
    lastError: meta.lastError,
    offlineSimulation: isOfflineSimulationEnabled(),
    unsupportedSimulation: platform.hasNotificationApi === false && platform.notificationPermission === "unsupported",
    simulatedReferenceIso: getSimulatedReferenceIso()
  };
}

export async function getNotificationTestingHistoryCounts(
  repository: FinanceRepository
): Promise<NotificationTestingHistoryCounts> {
  const queue = (await repository.listNotificationQueue()).filter(isTestNotification);
  const counts: NotificationTestingHistoryCounts = {
    generated: 0,
    queued: 0,
    delivered: 0,
    opened: 0,
    dismissed: 0,
    snoozed: 0,
    expired: 0,
    failed: 0
  };

  for (const item of queue) {
    switch (item.status) {
      case NotificationQueueStatus.GENERATED:
        counts.generated += 1;
        break;
      case NotificationQueueStatus.QUEUED:
      case NotificationQueueStatus.SCHEDULED:
        counts.queued += 1;
        break;
      case NotificationQueueStatus.DELIVERED:
        counts.delivered += 1;
        break;
      case NotificationQueueStatus.OPENED:
        counts.opened += 1;
        break;
      case NotificationQueueStatus.DISMISSED:
        counts.dismissed += 1;
        break;
      case NotificationQueueStatus.SNOOZED:
        counts.snoozed += 1;
        break;
      case NotificationQueueStatus.EXPIRED:
        counts.expired += 1;
        break;
      case NotificationQueueStatus.FAILED:
        counts.failed += 1;
        break;
      default:
        break;
    }
  }

  return counts;
}

export async function requestNotificationTestingPermission(repository: FinanceRepository) {
  const settings = normalizeNotificationSettings(await repository.getNotificationSettings());
  const manager = getNotificationProviderManager();
  const result = await manager.enableNotifications(settings);
  await repository.saveNotificationSettings(result.settings);
  return result;
}

export async function sendPureTestNotification() {
  const manager = getNotificationProviderManager();
  const settings = normalizeNotificationSettings({
    ...DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS,
    enabled: true,
    updatedAt: new Date().toISOString()
  });

  try {
    const delivered = await manager.deliverDeviceNotification(
      {
        id: createNotificationTestId(`pure-${Date.now()}`),
        title: "Finance Command Center",
        body: "This is a test notification.",
        tag: createNotificationTestId("pure-tag"),
        data: {
          notification_id: createNotificationTestId("pure"),
          timeline_id: "",
          source_event_id: "",
          product_id: "",
          product_type_id: ""
        }
      },
      {
        ...settings,
        capabilities: {
          ...settings.capabilities,
          deviceNotifications: true
        }
      }
    );

    if (delivered) {
      recordNotificationTestDelivery(new Date().toISOString());
    } else {
      recordNotificationTestError("Device notification was not delivered.");
    }

    return { delivered };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown delivery error";
    recordNotificationTestError(message);
    throw error;
  }
}

export async function createTestReminderViaPipeline(repository: FinanceRepository) {
  return runScenarioViaPipeline(repository, "emi_due_tomorrow");
}

export async function runScenarioViaPipeline(
  repository: FinanceRepository,
  scenario: NotificationTestScenario
) {
  const nowIso = new Date().toISOString();
  const referenceDate = resolveReferenceDate(nowIso);
  await ensureNotificationsEnabledForTesting(repository);

  const fixture = buildNotificationTestFixture(scenario, referenceDate, nowIso);
  await persistTestFixtures(repository, [fixture]);

  const result = await syncFinancialNotificationsFromTimeline(
    repository,
    referenceDate,
    resolveReferenceIso(nowIso)
  );

  const testNotifications = result.queue.filter(isTestNotification);
  if (testNotifications.length > 0) {
    recordNotificationTestDelivery(nowIso);
  }

  return {
    fixture,
    syncResult: result,
    testNotifications
  };
}

export async function generateTestReminders(
  repository: FinanceRepository,
  count: 1 | 10 | 100
) {
  const nowIso = new Date().toISOString();
  const referenceDate = resolveReferenceDate(nowIso);
  await ensureNotificationsEnabledForTesting(repository);

  const fixtures = buildBulkTestFixtures(count, referenceDate, nowIso);
  await persistTestFixtures(repository, fixtures);

  return syncFinancialNotificationsFromTimeline(repository, referenceDate, resolveReferenceIso(nowIso));
}

export async function generateGroupingTestReminders(repository: FinanceRepository) {
  const nowIso = new Date().toISOString();
  const referenceDate = resolveReferenceDate(nowIso);
  await ensureNotificationsEnabledForTesting(repository);

  const fixtures = buildGroupingTestFixtures(referenceDate, nowIso);
  await persistTestFixtures(repository, fixtures);

  return syncFinancialNotificationsFromTimeline(repository, referenceDate, resolveReferenceIso(nowIso));
}

export async function clearTestNotificationQueue(repository: FinanceRepository) {
  const [queue, history] = await Promise.all([
    repository.listNotificationQueue(),
    repository.listNotificationHistory()
  ]);

  const remainingQueue = queue.filter((item) => !isTestNotification(item));
  const testNotificationIds = new Set(queue.filter(isTestNotification).map((item) => item.id));
  const remainingHistory = history.filter(
    (entry) => !isTestHistoryEntry(entry, testNotificationIds)
  );

  await Promise.all([
    repository.saveNotificationQueue(remainingQueue),
    repository.saveNotificationHistory(remainingHistory)
  ]);

  return {
    removedQueueItems: queue.length - remainingQueue.length,
    removedHistoryItems: history.length - remainingHistory.length
  };
}

export async function resetNotificationTesting(repository: FinanceRepository) {
  const timelines = await repository.listFinancialTimelines();
  const testTimelines = timelines.filter((timeline) => isNotificationTestId(timeline.id));

  await Promise.all(testTimelines.map((timeline) => repository.deleteFinancialTimelineCascade(timeline.id)));

  const cleared = await clearTestNotificationQueue(repository);
  clearNotificationTestingSessionState();

  return {
    removedTimelines: testTimelines.length,
    ...cleared
  };
}

export async function setQuietHoursForTesting(
  repository: FinanceRepository,
  enabled: boolean
) {
  const settings = normalizeNotificationSettings(await repository.getNotificationSettings());
  const next = {
    ...settings,
    quietHours: { ...settings.quietHours, enabled },
    updatedAt: new Date().toISOString()
  };
  await repository.saveNotificationSettings(next);
  return next;
}

export async function simulateQuietHoursNow(repository: FinanceRepository) {
  const now = new Date();
  const quietIso = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 0, 0)
  ).toISOString();
  setSimulatedReferenceIso(quietIso);
  await setQuietHoursForTesting(repository, true);
  return quietIso;
}

export async function clearSimulatedTime() {
  setSimulatedReferenceIso(null);
}

export async function runOfflineSimulationTest(repository: FinanceRepository) {
  setOfflineSimulationEnabled(true);
  const result = await createTestReminderViaPipeline(repository);
  return result;
}

export async function recoverFromOfflineSimulation(repository: FinanceRepository) {
  setOfflineSimulationEnabled(false);
  return syncFinancialNotificationsFromTimeline(
    repository,
    resolveReferenceDate(),
    resolveReferenceIso()
  );
}

export function enableUnsupportedSimulation() {
  setUnsupportedSimulationEnabled(true);
}

export function disableUnsupportedSimulation() {
  setUnsupportedSimulationEnabled(false);
}

export async function performTestNotificationAction(
  repository: FinanceRepository,
  notificationId: string,
  action: typeof NotificationActionType[keyof typeof NotificationActionType]
) {
  const nowIso = resolveReferenceIso();
  const settings = normalizeNotificationSettings(await repository.getNotificationSettings());
  const [queue, history] = await Promise.all([
    repository.listNotificationQueue(),
    repository.listNotificationHistory()
  ]);

  const { queue: nextQueue, history: nextHistory, result } = handleNotificationAction(
    queue,
    history,
    {
      notificationId,
      action,
      snoozeMinutes: settings.defaultSnoozeMinutes
    },
    nowIso,
    settings
  );

  await Promise.all([
    repository.saveNotificationQueue(nextQueue),
    repository.saveNotificationHistory(nextHistory)
  ]);

  return { result, queue: nextQueue.filter(isTestNotification) };
}

export async function listTestNotifications(repository: FinanceRepository): Promise<FinancialNotification[]> {
  return (await repository.listNotificationQueue()).filter(isTestNotification);
}

export async function deliverTestQueueNow(repository: FinanceRepository) {
  if (isOfflineSimulationEnabled()) {
    return { deliveredCount: 0, deferredCount: 0, failedCount: 0 };
  }

  const nowIso = resolveReferenceIso();
  const settings = normalizeNotificationSettings(await repository.getNotificationSettings());
  const [queue, history] = await Promise.all([
    repository.listNotificationQueue(),
    repository.listNotificationHistory()
  ]);

  const delivered = deliverDeviceNotificationsViaManager({
    queue,
    history,
    settings,
    referenceIso: nowIso
  });

  await Promise.all([
    repository.saveNotificationQueue(delivered.queue),
    repository.saveNotificationHistory(delivered.history)
  ]);

  if (delivered.deliveredCount > 0) {
    recordNotificationTestDelivery(nowIso);
  }

  return delivered;
}

export async function runDirectPipelineBenchmark(
  repository: FinanceRepository,
  count: number
) {
  const nowIso = new Date().toISOString();
  const referenceDate = resolveReferenceDate(nowIso);
  const settings = await ensureNotificationsEnabledForTesting(repository);
  const fixtures = buildBulkTestFixtures(count, referenceDate, nowIso);

  const timelines = fixtures.map((fixture) => fixture.timeline);
  const events = fixtures.map((fixture) => fixture.event);
  const existingQueue = await repository.listNotificationQueue();
  const history = await repository.listNotificationHistory();

  const started = performance.now();
  const processed = processFinancialNotifications({
    timelines: [...(await repository.listFinancialTimelines()), ...timelines],
    events: (
      await Promise.all(
        [...timelines, ...(await repository.listFinancialTimelines())].map((timeline) =>
          repository.listTimelineEvents(timeline.id)
        )
      )
    )
      .flat()
      .concat(events),
    referenceDate,
    settings,
    existingQueue,
    history,
    nowIso
  });
  const elapsedMs = performance.now() - started;

  return {
    elapsedMs,
    candidatesGenerated: processed.candidatesGenerated,
    queueSize: processed.queue.filter(isTestNotification).length
  };
}
