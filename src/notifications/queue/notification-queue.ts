import {
  NotificationActionType,
  NotificationQueueStatus,
  type FinancialNotification,
  type NotificationActionTypeValue,
  type NotificationCandidate,
  type NotificationHistoryEntry,
  type NotificationQueueStatusValue
} from "@/notifications/models";

const TERMINAL_STATUSES = new Set<NotificationQueueStatusValue>([
  NotificationQueueStatus.DELIVERED,
  NotificationQueueStatus.OPENED,
  NotificationQueueStatus.DISMISSED,
  NotificationQueueStatus.EXPIRED,
  NotificationQueueStatus.CANCELLED
]);

export function buildNotificationFingerprint(candidate: NotificationCandidate): string {
  return candidate.fingerprint;
}

export function mergeCandidatesIntoQueue(params: {
  candidates: NotificationCandidate[];
  existingQueue: FinancialNotification[];
  nowIso: string;
  buildNotification: (candidate: NotificationCandidate) => FinancialNotification;
}): FinancialNotification[] {
  const existingFingerprints = new Set(params.existingQueue.map((item) => item.fingerprint));
  const merged = [...params.existingQueue];

  for (const candidate of params.candidates) {
    if (existingFingerprints.has(candidate.fingerprint)) {
      continue;
    }

    merged.push(params.buildNotification(candidate));
    existingFingerprints.add(candidate.fingerprint);
  }

  return merged.sort(
    (first, second) =>
      new Date(first.scheduledDeliveryAt).getTime() - new Date(second.scheduledDeliveryAt).getTime()
  );
}

export function cancelObsoleteNotifications(
  queue: FinancialNotification[],
  confirmedOrSkippedEventIds: Set<string>,
  nowIso: string
): FinancialNotification[] {
  return queue.map((item) => {
    if (!confirmedOrSkippedEventIds.has(item.sourceEventId)) {
      return item;
    }

    if (TERMINAL_STATUSES.has(item.status)) {
      return item;
    }

    return {
      ...item,
      status: NotificationQueueStatus.CANCELLED,
      updatedAt: nowIso
    };
  });
}

export function transitionNotificationStatus(
  notification: FinancialNotification,
  nextStatus: NotificationQueueStatusValue,
  nowIso: string
): FinancialNotification {
  const next: FinancialNotification = {
    ...notification,
    status: nextStatus,
    updatedAt: nowIso
  };

  if (nextStatus === NotificationQueueStatus.DELIVERED) {
    next.deliveredAt = nowIso;
  }

  if (nextStatus === NotificationQueueStatus.OPENED) {
    next.openedAt = nowIso;
  }

  if (nextStatus === NotificationQueueStatus.DISMISSED) {
    next.dismissedAt = nowIso;
  }

  if (nextStatus === NotificationQueueStatus.EXPIRED) {
    next.expiredAt = nowIso;
  }

  if (nextStatus === NotificationQueueStatus.FAILED) {
    next.failedAt = nowIso;
  }

  return next;
}

export function markNotificationSnoozed(
  notification: FinancialNotification,
  snoozedUntil: string,
  nowIso: string
): FinancialNotification {
  return {
    ...notification,
    status: NotificationQueueStatus.SNOOZED,
    snoozedUntil,
    updatedAt: nowIso
  };
}

export function retryFailedNotification(
  notification: FinancialNotification,
  nowIso: string
): FinancialNotification {
  return {
    ...notification,
    status: NotificationQueueStatus.QUEUED,
    retryCount: notification.retryCount + 1,
    failedAt: undefined,
    updatedAt: nowIso
  };
}

export function appendHistoryEntry(
  history: NotificationHistoryEntry[],
  entry: NotificationHistoryEntry
): NotificationHistoryEntry[] {
  return [...history, entry];
}

export function createHistoryEntry(params: {
  id: string;
  notification: FinancialNotification;
  status: NotificationQueueStatusValue;
  occurredAt: string;
}): NotificationHistoryEntry {
  return {
    id: params.id,
    notificationId: params.notification.id,
    fingerprint: params.notification.fingerprint,
    notificationType: params.notification.notificationType,
    status: params.status,
    providerId: params.notification.providerId,
    occurredAt: params.occurredAt
  };
}

export function defaultNotificationActions(): NotificationActionTypeValue[] {
  return [
    NotificationActionType.MARK_PAID,
    NotificationActionType.OPEN_PRODUCT,
    NotificationActionType.SNOOZE,
    NotificationActionType.DISMISS
  ];
}

export function getDeliverableNotifications(
  queue: FinancialNotification[],
  referenceIso: string
): FinancialNotification[] {
  const referenceTime = new Date(referenceIso).getTime();

  return queue.filter((item) => {
    if (item.status === NotificationQueueStatus.SNOOZED) {
      return item.snoozedUntil ? new Date(item.snoozedUntil).getTime() <= referenceTime : false;
    }

    if (
      item.status !== NotificationQueueStatus.QUEUED &&
      item.status !== NotificationQueueStatus.SCHEDULED &&
      item.status !== NotificationQueueStatus.GENERATED
    ) {
      return false;
    }

    return new Date(item.scheduledDeliveryAt).getTime() <= referenceTime;
  });
}

export function sortQueueByPriority(queue: FinancialNotification[]): FinancialNotification[] {
  const priorityWeight = {
    critical: 0,
    high: 1,
    normal: 2,
    low: 3
  } as const;

  return [...queue].sort((first, second) => {
    const priorityDelta =
      priorityWeight[first.priority] - priorityWeight[second.priority];
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return (
      new Date(first.scheduledDeliveryAt).getTime() -
      new Date(second.scheduledDeliveryAt).getTime()
    );
  });
}
