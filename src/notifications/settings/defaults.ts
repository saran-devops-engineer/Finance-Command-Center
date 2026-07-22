import {
  NOTIFICATION_SETTINGS_ID,
  NotificationDeliveryMode,
  NotificationPrivacyLevel,
  NotificationProviderId,
  NotificationType,
  type FinancialNotificationSettings,
  type NotificationTypeValue
} from "@/notifications/models";
import { buildCapabilityState, detectPlatformCapabilities } from "@/notifications/manager/platform-detection";

export const DEFAULT_REMINDER_OFFSETS_DAYS = [30, 15, 7, 3, 1, 0] as const;

const ALL_NOTIFICATION_TYPES = Object.values(NotificationType) as NotificationTypeValue[];

export const DEFAULT_CATEGORY_ENABLED = ALL_NOTIFICATION_TYPES.reduce(
  (acc, type) => {
    acc[type] = true;
    return acc;
  },
  {} as Record<NotificationTypeValue, boolean>
);

export const DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS: FinancialNotificationSettings = {
  id: NOTIFICATION_SETTINGS_ID,
  enabled: false,
  deliveryMode: NotificationDeliveryMode.AUTOMATIC,
  privacyLevel: NotificationPrivacyLevel.BALANCED,
  groupingEnabled: true,
  quietHours: {
    enabled: true,
    startHour: 22,
    endHour: 7,
    allowCriticalOverride: true
  },
  defaultSnoozeMinutes: 60,
  categoryEnabled: DEFAULT_CATEGORY_ENABLED,
  reminderOffsetsDays: [...DEFAULT_REMINDER_OFFSETS_DAYS],
  capabilities: buildCapabilityState(detectPlatformCapabilities()),
  activeProviderId: NotificationProviderId.IN_APP_CENTER,
  updatedAt: new Date(0).toISOString()
};

/** Normalize persisted settings from any schema generation. */
export function normalizeNotificationSettings(
  raw: Partial<FinancialNotificationSettings> | null | undefined
): FinancialNotificationSettings {
  if (!raw) {
    return { ...DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS, updatedAt: new Date().toISOString() };
  }

  const platform = detectPlatformCapabilities();
  const legacyProvider =
    raw.activeProviderId ?? raw.defaultProviderId ?? NotificationProviderId.IN_APP_CENTER;

  return {
    ...DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS,
    ...raw,
    deliveryMode: NotificationDeliveryMode.AUTOMATIC,
    capabilities: raw.capabilities ?? buildCapabilityState(platform),
    activeProviderId: legacyProvider,
    updatedAt: raw.updatedAt ?? new Date().toISOString()
  };
}

export const CAPABILITY_LABELS = {
  inAppReminders: "In-App Reminders",
  notificationCenter: "Notification Center",
  deviceNotifications: "Device Notifications"
} as const;
