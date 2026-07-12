/**
 * Strongly typed application events.
 * Feature modules must use these constants — never magic strings.
 */
export const AppEvent = {
  APP_OPENED: "APP_OPENED",
  ONBOARDING_COMPLETED: "ONBOARDING_COMPLETED",
  HOME_LOAN_CREATED: "HOME_LOAN_CREATED",
  HOME_LOAN_UPDATED: "HOME_LOAN_UPDATED",
  HOME_LOAN_ARCHIVED: "HOME_LOAN_ARCHIVED",
  GOLD_LOAN_CREATED: "GOLD_LOAN_CREATED",
  CHIT_CREATED: "CHIT_CREATED",
  SIMULATOR_OPENED: "SIMULATOR_OPENED",
  ONE_TIME_PAYMENT_USED: "ONE_TIME_PAYMENT_USED",
  MONTHLY_PAYMENT_USED: "MONTHLY_PAYMENT_USED",
  TARGET_CLOSURE_USED: "TARGET_CLOSURE_USED",
  BACKUP_CREATED: "BACKUP_CREATED",
  RESTORE_COMPLETED: "RESTORE_COMPLETED",
  SETTINGS_OPENED: "SETTINGS_OPENED",
  FEEDBACK_SENT: "FEEDBACK_SENT",
  EXPORT_JSON: "EXPORT_JSON",
  IMPORT_JSON: "IMPORT_JSON"
} as const;

export type AppEventName = (typeof AppEvent)[keyof typeof AppEvent];

export interface AppEventPayloadMap {
  APP_OPENED: undefined;
  ONBOARDING_COMPLETED: undefined;
  HOME_LOAN_CREATED: { loanId: string };
  HOME_LOAN_UPDATED: { loanId: string };
  HOME_LOAN_ARCHIVED: { loanId: string };
  GOLD_LOAN_CREATED: { loanId: string };
  CHIT_CREATED: { chitId: string };
  SIMULATOR_OPENED: { loanId?: string };
  ONE_TIME_PAYMENT_USED: { loanId: string };
  MONTHLY_PAYMENT_USED: { loanId: string };
  TARGET_CLOSURE_USED: { loanId: string };
  BACKUP_CREATED: { filename: string };
  RESTORE_COMPLETED: undefined;
  SETTINGS_OPENED: undefined;
  FEEDBACK_SENT: undefined;
  EXPORT_JSON: undefined;
  IMPORT_JSON: undefined;
}

export type AppEventPayload<T extends AppEventName> = AppEventPayloadMap[T];

export interface AppEventEnvelope<T extends AppEventName = AppEventName> {
  name: T;
  payload?: AppEventPayload<T>;
  timestamp: string;
}

export function createAppEvent<T extends AppEventName>(
  name: T,
  payload?: AppEventPayload<T>
): AppEventEnvelope<T> {
  return {
    name,
    payload,
    timestamp: new Date().toISOString()
  };
}
