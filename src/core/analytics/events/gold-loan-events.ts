/** Gold loan — answers: Are users tracking gold loans? */
export const GoldLoanEvents = {
  GOLD_LOAN_CREATED: "GOLD_LOAN_CREATED",
  GOLD_LOAN_UPDATED: "GOLD_LOAN_UPDATED",
  GOLD_LOAN_ARCHIVED: "GOLD_LOAN_ARCHIVED",
  GOLD_LOAN_DELETED: "GOLD_LOAN_DELETED",
  GOLD_LOAN_VIEWED: "GOLD_LOAN_VIEWED"
} as const;

export type GoldLoanEventName = (typeof GoldLoanEvents)[keyof typeof GoldLoanEvents];

export interface GoldLoanEventPayloadMap {
  GOLD_LOAN_CREATED: { loan_id: string };
  GOLD_LOAN_UPDATED: { loan_id: string };
  GOLD_LOAN_ARCHIVED: { loan_id: string };
  GOLD_LOAN_DELETED: { loan_id: string };
  GOLD_LOAN_VIEWED: { loan_id: string };
}
