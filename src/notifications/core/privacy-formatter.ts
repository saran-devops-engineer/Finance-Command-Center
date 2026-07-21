import {
  NotificationPrivacyLevel,
  NotificationType,
  type NotificationCandidate,
  type NotificationPrivacyLevelValue
} from "@/notifications/models";

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function resolveEventLabel(eventType: NotificationCandidate["eventType"]): string {
  switch (eventType) {
    case "emi":
      return "EMI";
    case "contribution":
      return "Contribution";
    case "premium":
      return "Premium";
    case "renewal":
      return "Renewal";
    case "installment":
      return "Installment";
    default:
      return "Payment";
  }
}

function resolveTimingLabel(type: NotificationCandidate["notificationType"]): string {
  switch (type) {
    case NotificationType.DUE_TODAY:
      return "Due Today";
    case NotificationType.DUE_TOMORROW:
      return "Due Tomorrow";
    case NotificationType.OVERDUE:
      return "Overdue";
    case NotificationType.PENDING_CONFIRMATION:
      return "Needs Confirmation";
    case NotificationType.MISSED_CONFIRMATION:
      return "Missed Confirmation";
    default:
      return "Upcoming";
  }
}

export function formatNotificationContent(
  candidate: NotificationCandidate,
  privacyLevel: NotificationPrivacyLevelValue
): { title: string; body: string } {
  const timing = resolveTimingLabel(candidate.notificationType);
  const eventLabel = resolveEventLabel(candidate.eventType);

  if (privacyLevel === NotificationPrivacyLevel.PRIVATE) {
    return {
      title: "Financial Reminder",
      body: timing
    };
  }

  if (privacyLevel === NotificationPrivacyLevel.BALANCED) {
    return {
      title: `${eventLabel} ${timing}`,
      body: candidate.productLabel
    };
  }

  return {
    title: `${candidate.productLabel} ${eventLabel}`,
    body: `${formatInr(candidate.amount)} · ${timing} · ${candidate.dueDate}`
  };
}
