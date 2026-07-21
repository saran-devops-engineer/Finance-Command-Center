import type { FinancialNotificationSettings, NotificationPriorityValue } from "@/notifications/models";

export function isWithinQuietHours(
  referenceIso: string,
  settings: FinancialNotificationSettings
): boolean {
  if (!settings.quietHours.enabled) {
    return false;
  }

  const hour = new Date(referenceIso).getHours();
  const { startHour, endHour } = settings.quietHours;

  if (startHour === endHour) {
    return false;
  }

  if (startHour < endHour) {
    return hour >= startHour && hour < endHour;
  }

  return hour >= startHour || hour < endHour;
}

export function canDeliverDuringQuietHours(
  priority: NotificationPriorityValue,
  settings: FinancialNotificationSettings
): boolean {
  if (!settings.quietHours.enabled || !settings.quietHours.allowCriticalOverride) {
    return false;
  }

  return priority === "critical";
}
