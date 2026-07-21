/**
 * Financial Timeline — foundational domain for all recurring financial products.
 *
 * Product state is derived from confirmed events and activities only.
 * Expected events never silently modify financial facts.
 */

import type { ProductTypeIdValue } from "@/shared/domain/product";

/** Frozen event lifecycle — no shortcuts allowed. */
export const TimelineEventStatus = {
  SCHEDULED: "scheduled",
  DUE: "due",
  PENDING_CONFIRMATION: "pending_confirmation",
  CONFIRMED: "confirmed",
  SKIPPED: "skipped",
  MISSED: "missed"
} as const;

export type TimelineEventStatusValue =
  (typeof TimelineEventStatus)[keyof typeof TimelineEventStatus];

export const TimelineEventType = {
  EMI: "emi",
  INTEREST: "interest",
  PREMIUM: "premium",
  CONTRIBUTION: "contribution",
  INSTALLMENT: "installment",
  RENEWAL: "renewal",
  PREPAYMENT: "prepayment",
  MANUAL_ADJUSTMENT: "manual_adjustment",
  SUBSCRIPTION: "subscription",
  OTHER: "other"
} as const;

export type TimelineEventTypeValue = (typeof TimelineEventType)[keyof typeof TimelineEventType];

export const RecurrenceFrequency = {
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  HALF_YEARLY: "half-yearly",
  YEARLY: "yearly",
  WEEKLY: "weekly",
  CUSTOM: "custom"
} as const;

export type RecurrenceFrequencyValue =
  (typeof RecurrenceFrequency)[keyof typeof RecurrenceFrequency];

export const ConfirmationMode = {
  MANUAL: "manual",
  ASK_ME: "ask_me",
  SMART_AUTO: "smart_auto",
  ALWAYS_AUTO: "always_auto"
} as const;

export type ConfirmationModeValue = (typeof ConfirmationMode)[keyof typeof ConfirmationMode];

export const ConfidenceLevel = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low"
} as const;

export type ConfidenceLevelValue = (typeof ConfidenceLevel)[keyof typeof ConfidenceLevel];

export const FreshnessStatus = {
  FRESH: "fresh",
  GOOD: "good",
  NEEDS_REVIEW: "needs_review",
  NEEDS_ATTENTION: "needs_attention",
  STALE: "stale"
} as const;

export type FreshnessStatusValue = (typeof FreshnessStatus)[keyof typeof FreshnessStatus];

export const TimelineActivityKind = {
  PRODUCT_CREATED: "product_created",
  PRODUCT_EDITED: "product_edited",
  EVENT_CONFIRMED: "event_confirmed",
  EVENT_SKIPPED: "event_skipped",
  EVENT_MISSED: "event_missed",
  PREPAYMENT: "prepayment",
  OUTSTANDING_UPDATED: "outstanding_updated",
  INTEREST_CHANGED: "interest_changed",
  TENURE_UPDATED: "tenure_updated",
  MANUAL_ADJUSTMENT: "manual_adjustment",
  COMMITMENT_COMPLETED: "commitment_completed"
} as const;

export type TimelineActivityKindValue =
  (typeof TimelineActivityKind)[keyof typeof TimelineActivityKind];

export interface RecurringSchedule {
  frequency: RecurrenceFrequencyValue;
  startDate: string;
  endDate?: string;
  dueDayOfMonth?: number;
  installmentCount?: number;
  amount: number;
  /** Used when frequency is custom — interval in days. */
  customIntervalDays?: number;
  eventType: TimelineEventTypeValue;
}

export interface LastConfirmedState {
  confirmedAt: string;
  confirmedActivityId: string;
  asOfDate: string;
  outstandingBalance?: number;
  remainingTenureMonths?: number;
  snapshot: Record<string, unknown>;
}

export interface FinancialTimeline {
  id: string;
  productTypeId: ProductTypeIdValue;
  productId: string;
  schedule: RecurringSchedule;
  confirmationMode: ConfirmationModeValue | null;
  lastConfirmedState: LastConfirmedState;
  freshnessStatus: FreshnessStatusValue;
  freshnessScore: 1 | 2 | 3 | 4 | 5;
  status: "active" | "archived" | "closed";
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  timelineId: string;
  sequenceNumber: number;
  eventType: TimelineEventTypeValue;
  scheduledDate: string;
  dueDate: string;
  amount: number;
  status: TimelineEventStatusValue;
  confirmedAt?: string;
  confirmedActivityId?: string;
  skippedAt?: string;
  missedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineActivity {
  id: string;
  timelineId: string;
  kind: TimelineActivityKindValue;
  title: string;
  description?: string;
  occurredAt: string;
  eventId?: string;
  stateDelta?: Record<string, unknown>;
  createdAt: string;
}

export const TIMELINE_SETTINGS_ID = "primary" as const;

export interface FinancialTimelineSettings {
  id: typeof TIMELINE_SETTINGS_ID;
  defaultConfirmationMode: ConfirmationModeValue;
  /** Minimum confidence score (0–100) required for smart auto confirmation. */
  smartAutoThreshold: number;
  pendingReminderDays: number;
  reviewOverdueDays: number;
  showFreshnessIndicator: boolean;
  updatedAt: string;
}

export interface TimelineDashboardSummary {
  confirmedCount: number;
  pendingConfirmationCount: number;
  missedCount: number;
  lastUpdatedLabel: string;
  needsReview: boolean;
}

export interface ConfirmationReviewPrompt {
  pendingEventIds: string[];
  message: string;
  options: Array<"mark_all_paid" | "review_individually" | "skip_for_now">;
}

export interface ConfidenceAssessment {
  score: number;
  level: ConfidenceLevelValue;
  factors: ConfidenceFactorResult[];
}

export interface ConfidenceFactorResult {
  factorId: string;
  label: string;
  score: number;
  weight: number;
}
