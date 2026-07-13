/** Settings — answers: Are users engaging with preferences? */
export const SettingsEvents = {
  SETTINGS_OPENED: "SETTINGS_OPENED",
  THEME_CHANGED: "THEME_CHANGED",
  ANALYTICS_CHANGED: "ANALYTICS_CHANGED"
} as const;

export type SettingsEventName = (typeof SettingsEvents)[keyof typeof SettingsEvents];

export interface SettingsEventPayloadMap {
  SETTINGS_OPENED: undefined;
  THEME_CHANGED: undefined;
  ANALYTICS_CHANGED: undefined;
}
