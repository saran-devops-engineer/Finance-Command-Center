import {
  NOTIFICATION_SETTINGS_ID,
  NotificationPrivacyLevel,
  NotificationProviderId,
  NotificationType,
  type FinancialNotificationSettings,
  type NotificationTypeValue
} from "@/notifications/models";

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
  enabled: true,
  defaultProviderId: NotificationProviderId.BROWSER,
  privacyLevel: NotificationPrivacyLevel.BALANCED,
  groupingEnabled: true,
  quietHours: {
    enabled: true,
    startHour: 22,
    endHour: 7,
    allowCriticalOverride: true
  },
  defaultSnoozeMinutes: 60,
  soundEnabled: true,
  categoryEnabled: DEFAULT_CATEGORY_ENABLED,
  reminderOffsetsDays: [...DEFAULT_REMINDER_OFFSETS_DAYS],
  updatedAt: new Date(0).toISOString()
};
