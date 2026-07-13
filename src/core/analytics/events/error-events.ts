/** Errors — answers: Where is the application failing for users? */
export const ErrorEvents = {
  ERROR_OCCURRED: "ERROR_OCCURRED"
} as const;

export type ErrorEventName = (typeof ErrorEvents)[keyof typeof ErrorEvents];

export interface ErrorEventPayloadMap {
  ERROR_OCCURRED: { message?: string };
}
