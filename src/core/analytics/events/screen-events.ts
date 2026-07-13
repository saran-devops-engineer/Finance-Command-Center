import type { ScreenNameValue } from "@/core/analytics/events/event-properties";

/** Screen navigation — answers: Which screens are most frequently visited? */
export const ScreenEvents = {
  SCREEN_VIEWED: "SCREEN_VIEWED"
} as const;

export type ScreenEventName = (typeof ScreenEvents)[keyof typeof ScreenEvents];

export interface ScreenEventPayloadMap {
  SCREEN_VIEWED: {
    screen_name: ScreenNameValue;
    module_version?: string;
  };
}
