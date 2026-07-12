/**
 * Strongly typed application events.
 * Feature modules must use these constants — never magic strings.
 */
export const AppEvent = {
  APP_OPENED: "APP_OPENED",
  APP_INSTALLED: "APP_INSTALLED",
  ONBOARDING_STARTED: "ONBOARDING_STARTED",
  ONBOARDING_COMPLETED: "ONBOARDING_COMPLETED",
  HOME_DASHBOARD_OPENED: "HOME_DASHBOARD_OPENED",
  SETTINGS_OPENED: "SETTINGS_OPENED",
  HOME_LOAN_CREATED: "HOME_LOAN_CREATED",
  HOME_LOAN_UPDATED: "HOME_LOAN_UPDATED",
  HOME_LOAN_ARCHIVED: "HOME_LOAN_ARCHIVED",
  HOME_LOAN_DELETED: "HOME_LOAN_DELETED",
  GOLD_LOAN_CREATED: "GOLD_LOAN_CREATED",
  GOLD_LOAN_UPDATED: "GOLD_LOAN_UPDATED",
  GOLD_LOAN_ARCHIVED: "GOLD_LOAN_ARCHIVED",
  CHIT_CREATED: "CHIT_CREATED",
  CHIT_UPDATED: "CHIT_UPDATED",
  CHIT_ARCHIVED: "CHIT_ARCHIVED",
  SIMULATOR_OPENED: "SIMULATOR_OPENED",
  ONE_TIME_PAYMENT_USED: "ONE_TIME_PAYMENT_USED",
  MONTHLY_EXTRA_PAYMENT_USED: "MONTHLY_EXTRA_PAYMENT_USED",
  ANNUAL_EXTRA_PAYMENT_USED: "ANNUAL_EXTRA_PAYMENT_USED",
  TARGET_CLOSURE_USED: "TARGET_CLOSURE_USED",
  REDUCE_EMI_USED: "REDUCE_EMI_USED",
  REDUCE_TENURE_USED: "REDUCE_TENURE_USED",
  BACKUP_CREATED: "BACKUP_CREATED",
  BACKUP_RESTORED: "BACKUP_RESTORED",
  EXPORT_JSON: "EXPORT_JSON",
  IMPORT_JSON: "IMPORT_JSON",
  ERROR_OCCURRED: "ERROR_OCCURRED",
  FEEDBACK_SUBMITTED: "FEEDBACK_SUBMITTED"
} as const;

export type AppEventName = (typeof AppEvent)[keyof typeof AppEvent];

export interface AppEventPayloadMap {
  APP_OPENED: undefined;
  APP_INSTALLED: undefined;
  ONBOARDING_STARTED: undefined;
  ONBOARDING_COMPLETED: undefined;
  HOME_DASHBOARD_OPENED: undefined;
  SETTINGS_OPENED: undefined;
  HOME_LOAN_CREATED: { loanId: string };
  HOME_LOAN_UPDATED: { loanId: string };
  HOME_LOAN_ARCHIVED: { loanId: string };
  HOME_LOAN_DELETED: { loanId: string };
  GOLD_LOAN_CREATED: { loanId: string };
  GOLD_LOAN_UPDATED: { loanId: string };
  GOLD_LOAN_ARCHIVED: { loanId: string };
  CHIT_CREATED: { chitId: string };
  CHIT_UPDATED: { chitId: string };
  CHIT_ARCHIVED: { chitId: string };
  SIMULATOR_OPENED: { loanId?: string };
  ONE_TIME_PAYMENT_USED: { loanId: string };
  MONTHLY_EXTRA_PAYMENT_USED: { loanId: string };
  ANNUAL_EXTRA_PAYMENT_USED: { loanId: string };
  TARGET_CLOSURE_USED: { loanId: string };
  REDUCE_EMI_USED: { loanId: string };
  REDUCE_TENURE_USED: { loanId: string };
  BACKUP_CREATED: { filename: string };
  BACKUP_RESTORED: undefined;
  EXPORT_JSON: undefined;
  IMPORT_JSON: undefined;
  ERROR_OCCURRED: { message?: string };
  FEEDBACK_SUBMITTED: undefined;
}

export type AppEventPayload<T extends AppEventName> = AppEventPayloadMap[T];

export interface AppEventEnvelope<T extends AppEventName = AppEventName> {
  name: T;
  payload?: AppEventPayload<T>;
}

export function createAppEvent<T extends AppEventName>(
  name: T,
  payload?: AppEventPayload<T>
): AppEventEnvelope<T> {
  return {
    name,
    payload
  };
}
