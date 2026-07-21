export const LENDER_SUGGESTIONS = [
  "HDFC Bank",
  "ICICI Bank",
  "SBI",
  "Axis Bank",
  "Canara Bank",
  "Union Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "Kotak Mahindra Bank",
  "IDFC First Bank",
  "Other"
] as const;

export type LenderSuggestion = (typeof LENDER_SUGGESTIONS)[number];

export function isOtherLender(value: string) {
  return value.trim().toLowerCase() === "other";
}

export function resolveLenderValue(selected: string, customLender: string) {
  if (isOtherLender(selected)) {
    return customLender.trim();
  }

  return selected.trim();
}
