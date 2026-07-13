/** Simulator — answers: Which repayment strategy is most popular? */
export const SimulatorEvents = {
  SIMULATOR_OPENED: "SIMULATOR_OPENED",
  ONE_TIME_PAYMENT_USED: "ONE_TIME_PAYMENT_USED",
  MONTHLY_EXTRA_PAYMENT_USED: "MONTHLY_EXTRA_PAYMENT_USED",
  ANNUAL_EXTRA_PAYMENT_USED: "ANNUAL_EXTRA_PAYMENT_USED",
  TARGET_CLOSURE_USED: "TARGET_CLOSURE_USED",
  REDUCE_EMI_USED: "REDUCE_EMI_USED",
  REDUCE_TENURE_USED: "REDUCE_TENURE_USED",
  FORECLOSURE_USED: "FORECLOSURE_USED"
} as const;

export type SimulatorEventName = (typeof SimulatorEvents)[keyof typeof SimulatorEvents];

export interface SimulatorEventPayloadMap {
  SIMULATOR_OPENED: { loan_id: string };
  ONE_TIME_PAYMENT_USED: { loan_id: string };
  MONTHLY_EXTRA_PAYMENT_USED: { loan_id: string };
  ANNUAL_EXTRA_PAYMENT_USED: { loan_id: string };
  TARGET_CLOSURE_USED: { loan_id: string };
  REDUCE_EMI_USED: { loan_id: string };
  REDUCE_TENURE_USED: { loan_id: string };
  FORECLOSURE_USED: { loan_id: string };
}
