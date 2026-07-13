/** Onboarding — answers: Are users successfully entering the app? */
export const OnboardingEvents = {
  ONBOARDING_STARTED: "ONBOARDING_STARTED",
  ONBOARDING_COMPLETED: "ONBOARDING_COMPLETED",
  ONBOARDING_SKIPPED: "ONBOARDING_SKIPPED"
} as const;

export type OnboardingEventName = (typeof OnboardingEvents)[keyof typeof OnboardingEvents];

export interface OnboardingEventPayloadMap {
  ONBOARDING_STARTED: undefined;
  ONBOARDING_COMPLETED: undefined;
  ONBOARDING_SKIPPED: undefined;
}
