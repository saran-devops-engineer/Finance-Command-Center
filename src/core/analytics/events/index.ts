import { ApplicationEvents, type ApplicationEventPayloadMap } from "./application-events";
import { OnboardingEvents, type OnboardingEventPayloadMap } from "./onboarding-events";
import { ScreenEvents, type ScreenEventPayloadMap } from "./screen-events";
import { HomeLoanEvents, type HomeLoanEventPayloadMap } from "./loan-events";
import { GoldLoanEvents, type GoldLoanEventPayloadMap } from "./gold-loan-events";
import { ChitEvents, type ChitEventPayloadMap } from "./chit-events";
import { SimulatorEvents, type SimulatorEventPayloadMap } from "./simulator-events";
import { MoneyEvents, type MoneyEventPayloadMap } from "./money-events";
import { BackupEvents, type BackupEventPayloadMap } from "./backup-events";
import { ProfileEvents, type ProfileEventPayloadMap } from "./profile-events";
import { SettingsEvents, type SettingsEventPayloadMap } from "./settings-events";
import { FeedbackEvents, type FeedbackEventPayloadMap } from "./feedback-events";
import { ErrorEvents, type ErrorEventPayloadMap } from "./error-events";
import type { EventCategory } from "./event-properties";

export { StandardActions, type StandardAction } from "./standard-actions";
export { ApplicationEvents, type ApplicationEventName, type ApplicationEventPayloadMap } from "./application-events";
export { OnboardingEvents, type OnboardingEventName, type OnboardingEventPayloadMap } from "./onboarding-events";
export { ScreenEvents, type ScreenEventName, type ScreenEventPayloadMap } from "./screen-events";
export { HomeLoanEvents, type HomeLoanEventName, type HomeLoanEventPayloadMap } from "./loan-events";
export { GoldLoanEvents, type GoldLoanEventName, type GoldLoanEventPayloadMap } from "./gold-loan-events";
export { ChitEvents, type ChitEventName, type ChitEventPayloadMap } from "./chit-events";
export { SimulatorEvents, type SimulatorEventName, type SimulatorEventPayloadMap } from "./simulator-events";
export { MoneyEvents, type MoneyEventName, type MoneyEventPayloadMap } from "./money-events";
export { BackupEvents, type BackupEventName, type BackupEventPayloadMap } from "./backup-events";
export { ProfileEvents, type ProfileEventName, type ProfileEventPayloadMap } from "./profile-events";
export { SettingsEvents, type SettingsEventName, type SettingsEventPayloadMap } from "./settings-events";
export { FeedbackEvents, type FeedbackEventName, type FeedbackEventPayloadMap } from "./feedback-events";
export { ErrorEvents, type ErrorEventName, type ErrorEventPayloadMap } from "./error-events";
export {
  ScreenName,
  type ScreenNameValue,
  type AutomaticEventProperties,
  type OptionalEventProperties,
  type EventCategory
} from "./event-properties";

/**
 * FCC Event Taxonomy V1 — the official analytics language.
 * Every track() call must use AppEvent.* — never magic strings.
 */
export const AppEvent = {
  ...ApplicationEvents,
  ...OnboardingEvents,
  ...ScreenEvents,
  ...HomeLoanEvents,
  ...GoldLoanEvents,
  ...ChitEvents,
  ...SimulatorEvents,
  ...MoneyEvents,
  ...BackupEvents,
  ...ProfileEvents,
  ...SettingsEvents,
  ...FeedbackEvents,
  ...ErrorEvents
} as const;

export type AppEventPayloadMap = ApplicationEventPayloadMap &
  OnboardingEventPayloadMap &
  ScreenEventPayloadMap &
  HomeLoanEventPayloadMap &
  GoldLoanEventPayloadMap &
  ChitEventPayloadMap &
  SimulatorEventPayloadMap &
  MoneyEventPayloadMap &
  BackupEventPayloadMap &
  ProfileEventPayloadMap &
  SettingsEventPayloadMap &
  FeedbackEventPayloadMap &
  ErrorEventPayloadMap;

export type AppEventName = keyof AppEventPayloadMap;

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

export const EVENT_CATEGORIES: Record<AppEventName, EventCategory> = {
  APP_OPENED: "Application",
  APP_INSTALLED: "Application",
  APP_UPDATED: "Application",
  APP_CLOSED: "Application",
  ONBOARDING_STARTED: "Onboarding",
  ONBOARDING_COMPLETED: "Onboarding",
  ONBOARDING_SKIPPED: "Onboarding",
  SCREEN_VIEWED: "Screen",
  HOME_LOAN_CREATED: "Home Loan",
  HOME_LOAN_UPDATED: "Home Loan",
  HOME_LOAN_ARCHIVED: "Home Loan",
  HOME_LOAN_DELETED: "Home Loan",
  HOME_LOAN_VIEWED: "Home Loan",
  GOLD_LOAN_CREATED: "Gold Loan",
  GOLD_LOAN_UPDATED: "Gold Loan",
  GOLD_LOAN_ARCHIVED: "Gold Loan",
  GOLD_LOAN_DELETED: "Gold Loan",
  GOLD_LOAN_VIEWED: "Gold Loan",
  CHIT_CREATED: "Chits",
  CHIT_UPDATED: "Chits",
  CHIT_ARCHIVED: "Chits",
  CHIT_DELETED: "Chits",
  CHIT_VIEWED: "Chits",
  SIMULATOR_OPENED: "Simulator",
  ONE_TIME_PAYMENT_USED: "Simulator",
  MONTHLY_EXTRA_PAYMENT_USED: "Simulator",
  ANNUAL_EXTRA_PAYMENT_USED: "Simulator",
  TARGET_CLOSURE_USED: "Simulator",
  REDUCE_EMI_USED: "Simulator",
  REDUCE_TENURE_USED: "Simulator",
  FORECLOSURE_USED: "Simulator",
  INCOME_UPDATED: "Money",
  EXPENSE_UPDATED: "Money",
  BUFFER_UPDATED: "Money",
  BACKUP_CREATED: "Backup",
  BACKUP_RESTORED: "Backup",
  EXPORT_JSON: "Backup",
  IMPORT_JSON: "Backup",
  PROFILE_CREATED: "Profile",
  PROFILE_UPDATED: "Profile",
  SETTINGS_OPENED: "Settings",
  THEME_CHANGED: "Settings",
  ANALYTICS_CHANGED: "Settings",
  FEEDBACK_SUBMITTED: "Feedback",
  ERROR_OCCURRED: "Errors"
};

export const EVENT_BUSINESS_QUESTIONS: Record<AppEventName, string> = {
  APP_OPENED: "How often do users open the app?",
  APP_INSTALLED: "How many users install the PWA?",
  APP_UPDATED: "How often do users receive app updates?",
  APP_CLOSED: "When do users leave the app?",
  ONBOARDING_STARTED: "How many users begin onboarding?",
  ONBOARDING_COMPLETED: "Are users successfully entering the app?",
  ONBOARDING_SKIPPED: "Do users skip onboarding?",
  SCREEN_VIEWED: "Which screens are most frequently visited?",
  HOME_LOAN_CREATED: "How many users create home loans?",
  HOME_LOAN_UPDATED: "Do users maintain home loan records?",
  HOME_LOAN_ARCHIVED: "How often are home loans archived?",
  HOME_LOAN_DELETED: "How often are home loans deleted?",
  HOME_LOAN_VIEWED: "Which home loans do users inspect?",
  GOLD_LOAN_CREATED: "Are users tracking gold loans?",
  GOLD_LOAN_UPDATED: "Do users maintain gold loan records?",
  GOLD_LOAN_ARCHIVED: "How often are gold loans archived?",
  GOLD_LOAN_DELETED: "How often are gold loans deleted?",
  GOLD_LOAN_VIEWED: "Which gold loans do users inspect?",
  CHIT_CREATED: "Are users adopting the Chit module?",
  CHIT_UPDATED: "Do users maintain chit records?",
  CHIT_ARCHIVED: "How often are chits archived?",
  CHIT_DELETED: "How often are chits deleted?",
  CHIT_VIEWED: "Which chits do users inspect?",
  SIMULATOR_OPENED: "How many users explore repayment scenarios?",
  ONE_TIME_PAYMENT_USED: "Which repayment strategy is most popular?",
  MONTHLY_EXTRA_PAYMENT_USED: "Which repayment strategy is most popular?",
  ANNUAL_EXTRA_PAYMENT_USED: "Which repayment strategy is most popular?",
  TARGET_CLOSURE_USED: "Which repayment strategy is most popular?",
  REDUCE_EMI_USED: "Which repayment strategy is most popular?",
  REDUCE_TENURE_USED: "Which repayment strategy is most popular?",
  FORECLOSURE_USED: "Which repayment strategy is most popular?",
  INCOME_UPDATED: "Are users maintaining income data?",
  EXPENSE_UPDATED: "Are users maintaining expense data?",
  BUFFER_UPDATED: "Are users building emergency buffers?",
  BACKUP_CREATED: "Are users protecting their data?",
  BACKUP_RESTORED: "How often do users restore from backup?",
  EXPORT_JSON: "How often do users export data?",
  IMPORT_JSON: "How often do users import data?",
  PROFILE_CREATED: "How many users create a profile?",
  PROFILE_UPDATED: "Do users personalize their command center?",
  SETTINGS_OPENED: "Are users engaging with preferences?",
  THEME_CHANGED: "Do users customize appearance?",
  ANALYTICS_CHANGED: "Do users control analytics preferences?",
  FEEDBACK_SUBMITTED: "Are users sharing product feedback?",
  ERROR_OCCURRED: "Where is the application failing for users?"
};

/** Events defined in taxonomy but not yet emitted by any feature. */
export const UNUSED_TAXONOMY_EVENTS: AppEventName[] = (
  Object.keys(AppEvent) as AppEventName[]
).filter((event) =>
  [
    "APP_UPDATED",
    "APP_CLOSED",
    "ONBOARDING_SKIPPED",
    "FORECLOSURE_USED",
    "THEME_CHANGED",
    "ANALYTICS_CHANGED",
    "FEEDBACK_SUBMITTED"
  ].includes(event)
);

export const TAXONOMY_EVENT_COUNT = Object.keys(AppEvent).length;
