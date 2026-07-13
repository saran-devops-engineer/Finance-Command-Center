import type { AppEventName, AppEventPayload } from "@/core/analytics/events";
import { trackAppEvent } from "@/core/events";
import { getApplicationServices } from "@/core/application/application-container";

export function trackApplicationEvent<T extends AppEventName>(
  event: T,
  payload?: AppEventPayload<T>
) {
  trackAppEvent(getApplicationServices().analytics, event, payload);
}

export function reportApplicationError(error: unknown, context?: Record<string, string>) {
  getApplicationServices().errorService.report(error, context);
}
