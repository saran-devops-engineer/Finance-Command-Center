import {
  ConfirmationMode,
  TIMELINE_SETTINGS_ID,
  type ConfirmationModeValue,
  type FinancialTimelineSettings
} from "@/shared/domain/financial-timeline";

export const DEFAULT_FINANCIAL_TIMELINE_SETTINGS: FinancialTimelineSettings = {
  id: TIMELINE_SETTINGS_ID,
  defaultConfirmationMode: ConfirmationMode.ASK_ME,
  smartAutoThreshold: 80,
  pendingReminderDays: 3,
  reviewOverdueDays: 90,
  showFreshnessIndicator: true,
  updatedAt: new Date(0).toISOString()
};

export function resolveConfirmationMode(
  settings: FinancialTimelineSettings,
  timelineMode: ConfirmationModeValue | null
): ConfirmationModeValue {
  return timelineMode ?? settings.defaultConfirmationMode;
}
