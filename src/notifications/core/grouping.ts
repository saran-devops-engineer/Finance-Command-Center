import {
  NotificationPriority,
  NotificationType,
  type FinancialNotification,
  type NotificationGroup
} from "@/notifications/models";

function groupTitleForDate(deliveryDate: string, count: number): string {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  if (deliveryDate === today) {
    return count === 1 ? "1 Financial Task Today" : `${count} Financial Tasks Today`;
  }

  if (deliveryDate === tomorrow) {
    return count === 1 ? "1 Financial Task Tomorrow" : `${count} Financial Tasks Tomorrow`;
  }

  return count === 1 ? "1 Financial Task" : `${count} Financial Tasks`;
}

export function groupNotifications(notifications: FinancialNotification[]): {
  groups: NotificationGroup[];
  notifications: FinancialNotification[];
} {
  const buckets = new Map<string, FinancialNotification[]>();

  for (const notification of notifications) {
    const deliveryDate = notification.scheduledDeliveryAt.slice(0, 10);
    const bucketKey = `${deliveryDate}:${notification.notificationType}`;
    const existing = buckets.get(bucketKey) ?? [];
    existing.push(notification);
    buckets.set(bucketKey, existing);
  }

  const groups: NotificationGroup[] = [];
  const groupedKeys = new Set<string>();

  for (const [bucketKey, items] of buckets.entries()) {
    if (items.length === 1) {
      continue;
    }

    groupedKeys.add(bucketKey);
    const deliveryDate = bucketKey.split(":")[0]!;
    const priority = items.some((item) => item.priority === NotificationPriority.CRITICAL)
      ? NotificationPriority.CRITICAL
      : items.some((item) => item.priority === NotificationPriority.HIGH)
        ? NotificationPriority.HIGH
        : NotificationPriority.NORMAL;

    groups.push({
      groupKey: bucketKey,
      title: groupTitleForDate(deliveryDate, items.length),
      summary: items.map((item) => item.productLabel).join(" · "),
      deliveryDate,
      notificationIds: items.map((item) => item.id),
      priority
    });
  }

  const withGroupKeys = notifications.map((notification) => {
    const deliveryDate = notification.scheduledDeliveryAt.slice(0, 10);
    const bucketKey = `${deliveryDate}:${notification.notificationType}`;
    if (!groupedKeys.has(bucketKey)) {
      return notification;
    }

    return { ...notification, groupKey: bucketKey };
  });

  return { groups, notifications: withGroupKeys };
}

export function shouldGroupType(type: FinancialNotification["notificationType"]): boolean {
  return (
    type === NotificationType.UPCOMING_DUE ||
    type === NotificationType.DUE_TOMORROW ||
    type === NotificationType.DUE_TODAY
  );
}
