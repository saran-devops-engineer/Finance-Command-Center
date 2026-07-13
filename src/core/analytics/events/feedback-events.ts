/** Feedback — answers: Are users sharing product feedback? */
export const FeedbackEvents = {
  FEEDBACK_SUBMITTED: "FEEDBACK_SUBMITTED"
} as const;

export type FeedbackEventName = (typeof FeedbackEvents)[keyof typeof FeedbackEvents];

export interface FeedbackEventPayloadMap {
  FEEDBACK_SUBMITTED: undefined;
}
