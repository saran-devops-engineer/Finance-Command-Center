import { AppEvent, ScreenName, type ScreenNameValue } from "@/core/analytics/events";
import { trackApplicationEvent } from "@/core/analytics/track-application-event";

export function trackScreenViewed(
  screenName: ScreenNameValue,
  options?: { module_version?: string }
) {
  trackApplicationEvent(AppEvent.SCREEN_VIEWED, {
    screen_name: screenName,
    ...(options?.module_version ? { module_version: options.module_version } : {})
  });
}

export { ScreenName };
