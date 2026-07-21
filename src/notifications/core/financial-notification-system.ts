import {
  NotificationActionType,
  NotificationProviderId,
  NotificationQueueStatus,
  type FinancialNotification,
  type FinancialNotificationSettings,
  type NotificationActionRequest,
  type NotificationActionResult,
  type NotificationCandidate,
  type NotificationCenterSummary,
  type NotificationDeliveryPayload,
  type NotificationGroup,
  type NotificationHistoryEntry
} from "@/notifications/models";
import { formatNotificationContent } from "@/notifications/core/privacy-formatter";
import { groupNotifications } from "@/notifications/core/grouping";
import {
  appendHistoryEntry,
  cancelObsoleteNotifications,
  createHistoryEntry,
  defaultNotificationActions,
  getDeliverableNotifications,
  mergeCandidatesIntoQueue,
  markNotificationSnoozed,
  retryFailedNotification,
  sortQueueByPriority,
  transitionNotificationStatus
} from "@/notifications/queue/notification-queue";
import { generateNotificationCandidates } from "@/notifications/rules/reminder-rules";
import {
  canDeliverDuringQuietHours,
  isWithinQuietHours
} from "@/notifications/scheduler/delivery-scheduler";
import type { NotificationRulesInput } from "@/notifications/rules/reminder-rules";
import type { FinancialNotificationProvider } from "@/notifications/providers/provider.interface";

export interface ProcessFinancialNotificationsInput extends NotificationRulesInput {
  existingQueue: FinancialNotification[];
  history: NotificationHistoryEntry[];
  nowIso: string;
}

export interface ProcessFinancialNotificationsResult {
  queue: FinancialNotification[];
  history: NotificationHistoryEntry[];
  groups: NotificationGroup[];
  candidatesGenerated: number;
  newlyQueued: number;
}

export interface DeliverNotificationsInput {
  queue: FinancialNotification[];
  history: NotificationHistoryEntry[];
  settings: FinancialNotificationSettings;
  provider: FinancialNotificationProvider;
  referenceIso: string;
}

export interface DeliverNotificationsResult {
  queue: FinancialNotification[];
  history: NotificationHistoryEntry[];
  deliveredCount: number;
  deferredCount: number;
  failedCount: number;
}

function buildNotificationFromCandidate(
  candidate: NotificationCandidate,
  settings: FinancialNotificationSettings,
  nowIso: string
): FinancialNotification {
  const content = formatNotificationContent(candidate, settings.privacyLevel);

  return {
    id: `fns-${candidate.fingerprint}`,
    fingerprint: candidate.fingerprint,
    notificationType: candidate.notificationType,
    timelineId: candidate.timelineId,
    sourceEventId: candidate.sourceEventId,
    productTypeId: candidate.productTypeId,
    productId: candidate.productId,
    productLabel: candidate.productLabel,
    eventType: candidate.eventType,
    dueDate: candidate.dueDate,
    amount: candidate.amount,
    title: content.title,
    body: content.body,
    status: NotificationQueueStatus.QUEUED,
    priority: candidate.priority,
    scheduledDeliveryAt: `${candidate.scheduledDeliveryDate}T08:00:00.000Z`,
    retryCount: 0,
    providerId: settings.defaultProviderId,
    actions: defaultNotificationActions(),
    createdAt: nowIso,
    updatedAt: nowIso
  };
}

export function processFinancialNotifications(
  input: ProcessFinancialNotificationsInput
): ProcessFinancialNotificationsResult {
  const candidates = generateNotificationCandidates(input);
  const beforeCount = input.existingQueue.length;

  let queue = mergeCandidatesIntoQueue({
    candidates,
    existingQueue: input.existingQueue,
    nowIso: input.nowIso,
    buildNotification: (candidate) =>
      buildNotificationFromCandidate(candidate, input.settings, input.nowIso)
  });

  const obsoleteEventIds = new Set(
    input.events
      .filter((event) => event.status === "confirmed" || event.status === "skipped")
      .map((event) => event.id)
  );

  queue = cancelObsoleteNotifications(queue, obsoleteEventIds, input.nowIso);

  const grouped = input.settings.groupingEnabled
    ? groupNotifications(queue)
    : { groups: [] as NotificationGroup[], notifications: queue };
  queue = grouped.notifications;

  return {
    queue,
    history: input.history,
    groups: grouped.groups,
    candidatesGenerated: candidates.length,
    newlyQueued: queue.length - beforeCount
  };
}

export function deliverDueNotifications(
  input: DeliverNotificationsInput
): DeliverNotificationsResult {
  if (!input.settings.enabled) {
    return {
      queue: input.queue,
      history: input.history,
      deliveredCount: 0,
      deferredCount: 0,
      failedCount: 0
    };
  }

  let queue = [...input.queue];
  let history = [...input.history];
  let deliveredCount = 0;
  let deferredCount = 0;
  let failedCount = 0;

  const deliverable = sortQueueByPriority(
    getDeliverableNotifications(queue, input.referenceIso)
  );

  for (const notification of deliverable) {
    const withinQuietHours = isWithinQuietHours(input.referenceIso, input.settings);
    if (
      withinQuietHours &&
      !canDeliverDuringQuietHours(notification.priority, input.settings)
    ) {
      deferredCount += 1;
      continue;
    }

    if (!input.provider.isSupported()) {
      deferredCount += 1;
      continue;
    }

    const payload: NotificationDeliveryPayload = {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      tag: notification.fingerprint,
      data: {
        notification_id: notification.id,
        timeline_id: notification.timelineId,
        source_event_id: notification.sourceEventId,
        product_id: notification.productId,
        product_type_id: notification.productTypeId
      }
    };

    try {
      void input.provider.deliver(payload);
      const delivered = transitionNotificationStatus(
        notification,
        NotificationQueueStatus.DELIVERED,
        input.referenceIso
      );
      queue = queue.map((item) => (item.id === delivered.id ? delivered : item));
      history = appendHistoryEntry(
        history,
        createHistoryEntry({
          id: `${delivered.id}-delivered-${input.referenceIso}`,
          notification: delivered,
          status: NotificationQueueStatus.DELIVERED,
          occurredAt: input.referenceIso
        })
      );
      deliveredCount += 1;
    } catch {
      const failed = transitionNotificationStatus(
        notification,
        NotificationQueueStatus.FAILED,
        input.referenceIso
      );
      queue = queue.map((item) => (item.id === failed.id ? failed : item));
      history = appendHistoryEntry(
        history,
        createHistoryEntry({
          id: `${failed.id}-failed-${input.referenceIso}`,
          notification: failed,
          status: NotificationQueueStatus.FAILED,
          occurredAt: input.referenceIso
        })
      );
      failedCount += 1;
    }
  }

  return { queue, history, deliveredCount, deferredCount, failedCount };
}

export function handleNotificationAction(
  queue: FinancialNotification[],
  history: NotificationHistoryEntry[],
  request: NotificationActionRequest,
  nowIso: string,
  settings: FinancialNotificationSettings
): {
  queue: FinancialNotification[];
  history: NotificationHistoryEntry[];
  result: NotificationActionResult | null;
} {
  const notification = queue.find((item) => item.id === request.notificationId);
  if (!notification) {
    return { queue, history, result: null };
  }

  if (request.action === NotificationActionType.SNOOZE) {
    const snoozeMinutes = request.snoozeMinutes ?? settings.defaultSnoozeMinutes;
    const snoozedUntil = new Date(Date.now() + snoozeMinutes * 60_000).toISOString();
    const snoozed = markNotificationSnoozed(notification, snoozedUntil, nowIso);
    const nextQueue = queue.map((item) => (item.id === snoozed.id ? snoozed : item));
    const nextHistory = appendHistoryEntry(
      history,
      createHistoryEntry({
        id: `${snoozed.id}-snoozed-${nowIso}`,
        notification: snoozed,
        status: NotificationQueueStatus.SNOOZED,
        occurredAt: nowIso
      })
    );

    return {
      queue: nextQueue,
      history: nextHistory,
      result: {
        notificationId: snoozed.id,
        action: request.action,
        timelineId: snoozed.timelineId,
        sourceEventId: snoozed.sourceEventId,
        productTypeId: snoozed.productTypeId,
        productId: snoozed.productId,
        snoozedUntil
      }
    };
  }

  if (request.action === NotificationActionType.DISMISS) {
    const dismissed = transitionNotificationStatus(
      notification,
      NotificationQueueStatus.DISMISSED,
      nowIso
    );
    const nextQueue = queue.map((item) => (item.id === dismissed.id ? dismissed : item));
    const nextHistory = appendHistoryEntry(
      history,
      createHistoryEntry({
        id: `${dismissed.id}-dismissed-${nowIso}`,
        notification: dismissed,
        status: NotificationQueueStatus.DISMISSED,
        occurredAt: nowIso
      })
    );

    return {
      queue: nextQueue,
      history: nextHistory,
      result: {
        notificationId: dismissed.id,
        action: request.action,
        timelineId: dismissed.timelineId,
        sourceEventId: dismissed.sourceEventId,
        productTypeId: dismissed.productTypeId,
        productId: dismissed.productId
      }
    };
  }

  if (
    request.action === NotificationActionType.MARK_PAID ||
    request.action === NotificationActionType.OPEN_PRODUCT ||
    request.action === NotificationActionType.OPEN_TIMELINE
  ) {
    const opened = transitionNotificationStatus(
      notification,
      NotificationQueueStatus.OPENED,
      nowIso
    );
    const nextQueue = queue.map((item) => (item.id === opened.id ? opened : item));
    const nextHistory = appendHistoryEntry(
      history,
      createHistoryEntry({
        id: `${opened.id}-opened-${nowIso}`,
        notification: opened,
        status: NotificationQueueStatus.OPENED,
        occurredAt: nowIso
      })
    );

    return {
      queue: nextQueue,
      history: nextHistory,
      result: {
        notificationId: opened.id,
        action: request.action,
        timelineId: opened.timelineId,
        sourceEventId: opened.sourceEventId,
        productTypeId: opened.productTypeId,
        productId: opened.productId
      }
    };
  }

  return { queue, history, result: null };
}

export function retryFailedNotifications(
  queue: FinancialNotification[],
  maxRetries: number,
  nowIso: string
): FinancialNotification[] {
  return queue.map((item) => {
    if (item.status !== NotificationQueueStatus.FAILED) {
      return item;
    }

    if (item.retryCount >= maxRetries) {
      return transitionNotificationStatus(item, NotificationQueueStatus.EXPIRED, nowIso);
    }

    return retryFailedNotification(item, nowIso);
  });
}

export function buildNotificationCenterSummary(
  queue: FinancialNotification[]
): NotificationCenterSummary {
  const today = new Date().toISOString().slice(0, 10);

  return {
    unreadCount: queue.filter(
      (item) =>
        item.status === NotificationQueueStatus.QUEUED ||
        item.status === NotificationQueueStatus.SCHEDULED ||
        item.status === NotificationQueueStatus.DELIVERED
    ).length,
    snoozedCount: queue.filter((item) => item.status === NotificationQueueStatus.SNOOZED).length,
    overdueCount: queue.filter((item) => item.notificationType === "overdue").length,
    todayCount: queue.filter((item) => item.scheduledDeliveryAt.slice(0, 10) === today).length
  };
}

export function createDefaultBrowserProviderId(): typeof NotificationProviderId.BROWSER {
  return NotificationProviderId.BROWSER;
}
