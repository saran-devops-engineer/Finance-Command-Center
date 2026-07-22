import { describe, expect, it, vi } from "vitest";
import {
  FreshnessStatus,
  TimelineEventStatus,
  TimelineEventType,
  type FinancialTimeline,
  type TimelineEvent
} from "@/shared/domain/financial-timeline";
import { ProductTypeId } from "@/shared/domain/product";
import {
  NotificationActionType,
  NotificationProviderId,
  NotificationQueueStatus,
  NotificationType,
  type FinancialNotification,
  type NotificationCandidate
} from "@/notifications/models";
import { DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS } from "@/notifications/settings/defaults";
import { generateNotificationCandidates } from "@/notifications/rules/reminder-rules";
import {
  mergeCandidatesIntoQueue,
  getDeliverableNotifications,
  sortQueueByPriority
} from "@/notifications/queue/notification-queue";
import { formatNotificationContent } from "@/notifications/core/privacy-formatter";
import { groupNotifications } from "@/notifications/core/grouping";
import {
  deliverDueNotifications,
  handleNotificationAction,
  processFinancialNotifications
} from "@/notifications/core/financial-notification-system";
import { isWithinQuietHours } from "@/notifications/scheduler/delivery-scheduler";
import { createBrowserFinancialNotificationProvider } from "@/notifications/providers";
import { migrateSchemaV3ToV4 } from "@/storage/migration/migrate-v3-to-v4";
import { DataSchemaVersion } from "@/shared/domain/schema-version";

const NOW = "2026-07-21T12:00:00.000Z";

function sampleTimeline(): FinancialTimeline {
  return {
    id: "timeline-loan-1",
    productTypeId: ProductTypeId.LOANS,
    productId: "loan-1",
    schedule: {
      frequency: "monthly",
      startDate: "2026-07-01",
      dueDayOfMonth: 5,
      installmentCount: 120,
      amount: 18_450,
      eventType: TimelineEventType.EMI
    },
    confirmationMode: null,
    lastConfirmedState: {
      confirmedAt: NOW,
      confirmedActivityId: "act-1",
      asOfDate: "2026-07-01",
      outstandingBalance: 1_500_000,
      remainingTenureMonths: 180,
      snapshot: { lender: "HDFC Bank", monthlyEmi: 18_450 }
    },
    freshnessStatus: FreshnessStatus.GOOD,
    freshnessScore: 4,
    status: "active",
    createdAt: NOW,
    updatedAt: NOW
  };
}

function sampleEvent(overrides: Partial<TimelineEvent> = {}): TimelineEvent {
  return {
    id: "evt-1",
    timelineId: "timeline-loan-1",
    sequenceNumber: 1,
    eventType: TimelineEventType.EMI,
    scheduledDate: "2026-07-05",
    dueDate: "2026-07-05",
    amount: 18_450,
    status: TimelineEventStatus.SCHEDULED,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides
  };
}

describe("Financial Notification System rules engine", () => {
  it("generates reminder candidates from timeline events without calculating schedules", () => {
    const candidates = generateNotificationCandidates({
      timelines: [sampleTimeline()],
      events: [sampleEvent()],
      referenceDate: "2026-07-04",
      settings: DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS
    });

    expect(candidates.some((candidate) => candidate.notificationType === NotificationType.DUE_TOMORROW)).toBe(
      true
    );
    expect(candidates[0]?.dueDate).toBe("2026-07-05");
  });

  it("creates pending confirmation reminders from timeline status", () => {
    const candidates = generateNotificationCandidates({
      timelines: [sampleTimeline()],
      events: [sampleEvent({ status: TimelineEventStatus.PENDING_CONFIRMATION })],
      referenceDate: "2026-07-10",
      settings: DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS
    });

    expect(candidates.some((candidate) => candidate.notificationType === NotificationType.PENDING_CONFIRMATION)).toBe(
      true
    );
  });
});

describe("Financial Notification System queue", () => {
  it("prevents duplicate notifications by fingerprint", () => {
    const candidate: NotificationCandidate = {
      fingerprint: "evt-1:due_tomorrow:1",
      notificationType: NotificationType.DUE_TOMORROW,
      timelineId: "timeline-loan-1",
      sourceEventId: "evt-1",
      productTypeId: ProductTypeId.LOANS,
      productId: "loan-1",
      productLabel: "HDFC Bank",
      eventType: TimelineEventType.EMI,
      eventStatus: TimelineEventStatus.SCHEDULED,
      dueDate: "2026-07-05",
      amount: 18_450,
      scheduledDeliveryDate: "2026-07-04",
      priority: "normal",
      reminderOffsetDays: 1
    };

    const build = (item: NotificationCandidate): FinancialNotification => ({
      id: `fns-${item.fingerprint}`,
      fingerprint: item.fingerprint,
      notificationType: item.notificationType,
      timelineId: item.timelineId,
      sourceEventId: item.sourceEventId,
      productTypeId: item.productTypeId,
      productId: item.productId,
      productLabel: item.productLabel,
      eventType: item.eventType,
      dueDate: item.dueDate,
      amount: item.amount,
      title: "Test",
      body: "Test",
      status: NotificationQueueStatus.QUEUED,
      priority: item.priority,
      scheduledDeliveryAt: `${item.scheduledDeliveryDate}T08:00:00.000Z`,
      retryCount: 0,
      providerId: NotificationProviderId.BROWSER,
      actions: [NotificationActionType.DISMISS],
      createdAt: NOW,
      updatedAt: NOW
    });

    const first = mergeCandidatesIntoQueue({
      candidates: [candidate],
      existingQueue: [],
      nowIso: NOW,
      buildNotification: build
    });

    const second = mergeCandidatesIntoQueue({
      candidates: [candidate],
      existingQueue: first,
      nowIso: NOW,
      buildNotification: build
    });

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
  });

  it("orders deliverable notifications by priority", () => {
    const queue: FinancialNotification[] = [
      {
        id: "n1",
        fingerprint: "a",
        notificationType: NotificationType.UPCOMING_DUE,
        timelineId: "timeline-loan-1",
        sourceEventId: "evt-1",
        productTypeId: ProductTypeId.LOANS,
        productId: "loan-1",
        productLabel: "A",
        eventType: TimelineEventType.EMI,
        dueDate: "2026-07-05",
        amount: 1000,
        title: "A",
        body: "A",
        status: NotificationQueueStatus.QUEUED,
        priority: "normal",
        scheduledDeliveryAt: "2026-07-21T08:00:00.000Z",
        retryCount: 0,
        providerId: NotificationProviderId.BROWSER,
        actions: [],
        createdAt: NOW,
        updatedAt: NOW
      },
      {
        id: "n2",
        fingerprint: "b",
        notificationType: NotificationType.OVERDUE,
        timelineId: "timeline-loan-1",
        sourceEventId: "evt-2",
        productTypeId: ProductTypeId.LOANS,
        productId: "loan-1",
        productLabel: "B",
        eventType: TimelineEventType.EMI,
        dueDate: "2026-07-01",
        amount: 1000,
        title: "B",
        body: "B",
        status: NotificationQueueStatus.QUEUED,
        priority: "critical",
        scheduledDeliveryAt: "2026-07-21T08:00:00.000Z",
        retryCount: 0,
        providerId: NotificationProviderId.BROWSER,
        actions: [],
        createdAt: NOW,
        updatedAt: NOW
      }
    ];

    const deliverable = sortQueueByPriority(getDeliverableNotifications(queue, NOW));
    expect(deliverable[0]?.priority).toBe("critical");
  });
});

describe("Financial Notification System privacy", () => {
  it("respects privacy levels", () => {
    const candidate: NotificationCandidate = {
      fingerprint: "evt-1:due_today:0",
      notificationType: NotificationType.DUE_TODAY,
      timelineId: "timeline-loan-1",
      sourceEventId: "evt-1",
      productTypeId: ProductTypeId.LOANS,
      productId: "loan-1",
      productLabel: "HDFC Bank",
      eventType: TimelineEventType.EMI,
      eventStatus: TimelineEventStatus.DUE,
      dueDate: "2026-07-21",
      amount: 18_450,
      scheduledDeliveryDate: "2026-07-21",
      priority: "high",
      reminderOffsetDays: 0
    };

    expect(formatNotificationContent(candidate, "private").title).toBe("Financial Reminder");
    expect(formatNotificationContent(candidate, "balanced").title).toContain("Due Today");
    expect(formatNotificationContent(candidate, "detailed").body).toContain("₹");
  });
});

describe("Financial Notification System orchestration", () => {
  it("groups same-day reminders", () => {
    const notifications: FinancialNotification[] = Array.from({ length: 3 }, (_, index) => ({
      id: `n-${index}`,
      fingerprint: `fp-${index}`,
      notificationType: NotificationType.DUE_TOMORROW,
      timelineId: `timeline-${index}`,
      sourceEventId: `evt-${index}`,
      productTypeId: ProductTypeId.LOANS,
      productId: `loan-${index}`,
      productLabel: `Product ${index}`,
      eventType: TimelineEventType.EMI,
      dueDate: "2026-07-22",
      amount: 1000,
      title: "Reminder",
      body: "Body",
      status: NotificationQueueStatus.QUEUED,
      priority: "normal",
      scheduledDeliveryAt: "2026-07-21T08:00:00.000Z",
      retryCount: 0,
      providerId: NotificationProviderId.BROWSER,
      actions: [],
      createdAt: NOW,
      updatedAt: NOW
    }));

    const grouped = groupNotifications(notifications);
    expect(grouped.groups).toHaveLength(1);
    expect(grouped.groups[0]?.notificationIds).toHaveLength(3);
  });

  it("defers non-critical delivery during quiet hours", () => {
    const queue: FinancialNotification[] = [
      {
        id: "n1",
        fingerprint: "a",
        notificationType: NotificationType.UPCOMING_DUE,
        timelineId: "timeline-loan-1",
        sourceEventId: "evt-1",
        productTypeId: ProductTypeId.LOANS,
        productId: "loan-1",
        productLabel: "A",
        eventType: TimelineEventType.EMI,
        dueDate: "2026-08-01",
        amount: 1000,
        title: "A",
        body: "A",
        status: NotificationQueueStatus.QUEUED,
        priority: "normal",
        scheduledDeliveryAt: "2026-07-21T23:00:00.000Z",
        retryCount: 0,
        providerId: NotificationProviderId.BROWSER,
        actions: [],
        createdAt: NOW,
        updatedAt: NOW
      }
    ];

    const settings = {
      ...DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS,
      enabled: true,
      capabilities: {
        ...DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS.capabilities,
        deviceNotifications: true
      },
      quietHours: { enabled: true, startHour: 22, endHour: 7, allowCriticalOverride: true }
    };

    expect(isWithinQuietHours("2026-07-21T23:00:00.000Z", settings)).toBe(true);

    const provider = createBrowserFinancialNotificationProvider();
    vi.spyOn(provider, "deliver").mockResolvedValue(undefined);

    const result = deliverDueNotifications({
      queue,
      history: [],
      settings,
      provider,
      referenceIso: "2026-07-21T23:00:00.000Z"
    });

    expect(result.deferredCount).toBe(1);
    expect(result.deliveredCount).toBe(0);
  });

  it("returns action results without mutating timeline directly", () => {
    const notification: FinancialNotification = {
      id: "n1",
      fingerprint: "a",
      notificationType: NotificationType.DUE_TODAY,
      timelineId: "timeline-loan-1",
      sourceEventId: "evt-1",
      productTypeId: ProductTypeId.LOANS,
      productId: "loan-1",
      productLabel: "HDFC Bank",
      eventType: TimelineEventType.EMI,
      dueDate: "2026-07-21",
      amount: 18_450,
      title: "Due",
      body: "Due",
      status: NotificationQueueStatus.QUEUED,
      priority: "high",
      scheduledDeliveryAt: NOW,
      retryCount: 0,
      providerId: NotificationProviderId.BROWSER,
      actions: [NotificationActionType.MARK_PAID],
      createdAt: NOW,
      updatedAt: NOW
    };

    const { result } = handleNotificationAction(
      [notification],
      [],
      { notificationId: "n1", action: NotificationActionType.MARK_PAID },
      NOW,
      DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS
    );

    expect(result?.action).toBe(NotificationActionType.MARK_PAID);
    expect(result?.sourceEventId).toBe("evt-1");
  });

  it("processes timeline subscriptions end-to-end offline", () => {
    const processed = processFinancialNotifications({
      timelines: [sampleTimeline()],
      events: [sampleEvent()],
      referenceDate: "2026-07-04",
      settings: { ...DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS, enabled: true },
      existingQueue: [],
      history: [],
      nowIso: NOW
    });

    expect(processed.candidatesGenerated).toBeGreaterThan(0);
    expect(processed.queue.length).toBeGreaterThan(0);
  });

  it("skips reminder generation when notifications are disabled", () => {
    const processed = processFinancialNotifications({
      timelines: [sampleTimeline()],
      events: [sampleEvent()],
      referenceDate: "2026-07-04",
      settings: { ...DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS, enabled: false },
      existingQueue: [],
      history: [],
      nowIso: NOW
    });

    expect(processed.candidatesGenerated).toBe(0);
    expect(processed.queue).toHaveLength(0);
  });
});

describe("Financial Notification System migration", () => {
  it("initializes V4 notification settings idempotently", () => {
    const first = migrateSchemaV3ToV4({
      existingSchemaMeta: {
        id: "primary",
        schemaVersion: DataSchemaVersion.V3,
        migratedAt: NOW,
        migrationNotes: [],
        needsReviewCount: 0
      },
      existingSettings: null,
      now: NOW
    });

    const second = migrateSchemaV3ToV4({
      existingSchemaMeta: first.schemaMeta,
      existingSettings: first.settings,
      now: NOW
    });

    expect(first.migrated).toBe(true);
    expect(first.toVersion).toBe(DataSchemaVersion.V4);
    expect(second.migrated).toBe(false);
  });
});

describe("Financial Notification System provider isolation", () => {
  it("browser provider degrades gracefully when unsupported", async () => {
    const provider = createBrowserFinancialNotificationProvider();
    await expect(
      provider.deliver({
        id: "n1",
        title: "Test",
        body: "Body",
        tag: "tag",
        data: {}
      })
    ).resolves.toBeUndefined();
  });
});

describe("Financial Notification System performance", () => {
  it("handles thousands of generated notifications", () => {
    const events = Array.from({ length: 1000 }, (_, index) =>
      sampleEvent({
        id: `evt-${index}`,
        dueDate: `2026-${String((index % 12) + 1).padStart(2, "0")}-05`
      })
    );

    const started = performance.now();
    const processed = processFinancialNotifications({
      timelines: [sampleTimeline()],
      events,
      referenceDate: "2026-07-04",
      settings: { ...DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS, enabled: true },
      existingQueue: [],
      history: [],
      nowIso: NOW
    });
    const elapsed = performance.now() - started;

    expect(processed.queue.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(3000);
  });
});
