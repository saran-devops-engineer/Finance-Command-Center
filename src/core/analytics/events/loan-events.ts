/** Home loan — answers: How many users create and manage home loans? */
export const HomeLoanEvents = {
  HOME_LOAN_CREATED: "HOME_LOAN_CREATED",
  HOME_LOAN_UPDATED: "HOME_LOAN_UPDATED",
  HOME_LOAN_ARCHIVED: "HOME_LOAN_ARCHIVED",
  HOME_LOAN_DELETED: "HOME_LOAN_DELETED",
  HOME_LOAN_VIEWED: "HOME_LOAN_VIEWED"
} as const;

export type HomeLoanEventName = (typeof HomeLoanEvents)[keyof typeof HomeLoanEvents];

export interface HomeLoanEventPayloadMap {
  HOME_LOAN_CREATED: { loan_id: string };
  HOME_LOAN_UPDATED: { loan_id: string };
  HOME_LOAN_ARCHIVED: { loan_id: string };
  HOME_LOAN_DELETED: { loan_id: string };
  HOME_LOAN_VIEWED: { loan_id: string };
}
