/** Application lifecycle — answers: Are users opening and installing the app? */
export const ApplicationEvents = {
  APP_OPENED: "APP_OPENED",
  APP_INSTALLED: "APP_INSTALLED",
  APP_UPDATED: "APP_UPDATED",
  APP_CLOSED: "APP_CLOSED"
} as const;

export type ApplicationEventName = (typeof ApplicationEvents)[keyof typeof ApplicationEvents];

export interface ApplicationEventPayloadMap {
  APP_OPENED: undefined;
  APP_INSTALLED: undefined;
  APP_UPDATED: undefined;
  APP_CLOSED: undefined;
}
