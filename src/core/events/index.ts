import type { AnalyticsService } from "@/core/analytics/analytics-service";
import {
  AppEvent,
  createAppEvent,
  type AppEventName,
  type AppEventPayload
} from "@/core/events/app-events";

export function trackAppEvent<T extends AppEventName>(
  analytics: AnalyticsService,
  event: T,
  payload?: AppEventPayload<T>
) {
  const envelope = createAppEvent(event, payload);
  analytics.track(
    envelope.name,
    envelope.payload as Record<string, string | number | boolean | null | undefined> | undefined
  );
}

export { AppEvent, createAppEvent };
export type { AppEventName, AppEventPayload, AppEventPayloadMap } from "@/core/events/app-events";

export {
  FINANCE_DATA_UPDATED_EVENT,
  notifyFinanceDataRestored,
  notifyFinanceDataUpdated,
  subscribeFinanceDataUpdated,
  type FinanceDataScope
} from "@/core/events/finance-data-events";
