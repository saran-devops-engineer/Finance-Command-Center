/** Money / cash flow — answers: Are users maintaining their cash-flow snapshot? */
export const MoneyEvents = {
  INCOME_UPDATED: "INCOME_UPDATED",
  EXPENSE_UPDATED: "EXPENSE_UPDATED",
  BUFFER_UPDATED: "BUFFER_UPDATED"
} as const;

export type MoneyEventName = (typeof MoneyEvents)[keyof typeof MoneyEvents];

export interface MoneyEventPayloadMap {
  INCOME_UPDATED: undefined;
  EXPENSE_UPDATED: undefined;
  BUFFER_UPDATED: undefined;
}
