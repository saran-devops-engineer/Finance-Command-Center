/**
 * Financial Notification System (FNS) — foundational domain types.
 *
 * FNS never calculates financial schedules or due dates.
 * It consumes Expected Financial Events from Financial Timeline only.
 */

import type { ProductTypeIdValue } from "@/shared/domain/product";
import type { TimelineEventStatusValue, TimelineEventTypeValue } from "@/shared/domain/financial-timeline";

export const NotificationType = {
  UPCOMING_DUE: "upcoming_due",
  DUE_TOMORROW: "due_tomorrow",
  DUE_TODAY: "due_today",
  OVERDUE: "overdue",
  PENDING_CONFIRMATION: "pending_confirmation",
  MISSED_CONFIRMATION: "missed_confirmation",
  FINANCIAL_HEALTH: "financial_health",
  INSURANCE_RENEWAL: "insurance_renewal",
  SUBSCRIPTION_RENEWAL: "subscription_renewal",
  SIP_REMINDER: "sip_reminder",
  RD_REMINDER: "rd_reminder",
  CUSTOM: "custom"
} as const;

export type NotificationTypeValue = (typeof NotificationType)[keyof typeof NotificationType];

export const NotificationQueueStatus = {
  GENERATED: "generated",
  QUEUED: "queued",
  SCHEDULED: "scheduled",
  DELIVERED: "delivered",
  OPENED: "opened",
  DISMISSED: "dismissed",
  SNOOZED: "snoozed",
  EXPIRED: "expired",
  FAILED: "failed",
  CANCELLED: "cancelled"
} as const;

export type NotificationQueueStatusValue =
  (typeof NotificationQueueStatus)[keyof typeof NotificationQueueStatus];

export const NotificationPriority = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  CRITICAL: "critical"
} as const;

export type NotificationPriorityValue =
  (typeof NotificationPriority)[keyof typeof NotificationPriority];

export const NotificationPrivacyLevel = {
  PRIVATE: "private",
  BALANCED: "balanced",
  DETAILED: "detailed"
} as const;

export type NotificationPrivacyLevelValue =
  (typeof NotificationPrivacyLevel)[keyof typeof NotificationPrivacyLevel];

export const NotificationActionType = {
  MARK_PAID: "mark_paid",
  OPEN_PRODUCT: "open_product",
  OPEN_TIMELINE: "open_timeline",
  SNOOZE: "snooze",
  DISMISS: "dismiss"
} as const;

export type NotificationActionTypeValue =
  (typeof NotificationActionType)[keyof typeof NotificationActionType];

export const NotificationProviderId = {
  BROWSER: "browser",
  WEB_PUSH: "web_push",
  EMAIL: "email",
  SMS: "sms",
  WHATSAPP: "whatsapp",
  NATIVE_MOBILE: "native_mobile"
} as const;

export type NotificationProviderIdValue =
  (typeof NotificationProviderId)[keyof typeof NotificationProviderId];

export const NOTIFICATION_SETTINGS_ID = "primary" as const;

/** Output of the Rules Engine — not yet in the queue. */
export interface NotificationCandidate {
  fingerprint: string;
  notificationType: NotificationTypeValue;
  timelineId: string;
  sourceEventId: string;
  productTypeId: ProductTypeIdValue;
  productId: string;
  productLabel: string;
  eventType: TimelineEventTypeValue;
  eventStatus: TimelineEventStatusValue;
  dueDate: string;
  amount: number;
  scheduledDeliveryDate: string;
  priority: NotificationPriorityValue;
  reminderOffsetDays: number;
}

export interface FinancialNotification {
  id: string;
  fingerprint: string;
  notificationType: NotificationTypeValue;
  timelineId: string;
  sourceEventId: string;
  productTypeId: ProductTypeIdValue;
  productId: string;
  productLabel: string;
  eventType: TimelineEventTypeValue;
  dueDate: string;
  amount: number;
  title: string;
  body: string;
  status: NotificationQueueStatusValue;
  priority: NotificationPriorityValue;
  scheduledDeliveryAt: string;
  deliveredAt?: string;
  openedAt?: string;
  dismissedAt?: string;
  snoozedUntil?: string;
  expiredAt?: string;
  failedAt?: string;
  retryCount: number;
  providerId: NotificationProviderIdValue;
  groupKey?: string;
  actions: NotificationActionTypeValue[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationHistoryEntry {
  id: string;
  notificationId: string;
  fingerprint: string;
  notificationType: NotificationTypeValue;
  status: NotificationQueueStatusValue;
  providerId: NotificationProviderIdValue;
  occurredAt: string;
  metadata?: Record<string, unknown>;
}

export interface QuietHoursConfig {
  enabled: boolean;
  startHour: number;
  endHour: number;
  allowCriticalOverride: boolean;
}

export interface FinancialNotificationSettings {
  id: typeof NOTIFICATION_SETTINGS_ID;
  enabled: boolean;
  defaultProviderId: NotificationProviderIdValue;
  privacyLevel: NotificationPrivacyLevelValue;
  groupingEnabled: boolean;
  quietHours: QuietHoursConfig;
  defaultSnoozeMinutes: number;
  soundEnabled: boolean;
  categoryEnabled: Record<NotificationTypeValue, boolean>;
  reminderOffsetsDays: number[];
  updatedAt: string;
}

export interface NotificationGroup {
  groupKey: string;
  title: string;
  summary: string;
  deliveryDate: string;
  notificationIds: string[];
  priority: NotificationPriorityValue;
}

export interface NotificationCenterSummary {
  unreadCount: number;
  snoozedCount: number;
  overdueCount: number;
  todayCount: number;
}

export interface NotificationActionRequest {
  notificationId: string;
  action: NotificationActionTypeValue;
  snoozeMinutes?: number;
}

/** Returned to callers — FNS never mutates timeline directly. */
export interface NotificationActionResult {
  notificationId: string;
  action: NotificationActionTypeValue;
  timelineId: string;
  sourceEventId: string;
  productTypeId: ProductTypeIdValue;
  productId: string;
  snoozedUntil?: string;
}

export interface NotificationDeliveryPayload {
  id: string;
  title: string;
  body: string;
  tag: string;
  data: Record<string, string>;
}
