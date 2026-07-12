/**
 * Chit Management V1 — standalone financial product (not a loan or investment).
 * Data model designed for V2 calculation engine extensions.
 */

export type ChitProviderType = "registered" | "local";

export type RegisteredChitProviderId =
  | "margadarshi"
  | "shriram"
  | "kapil"
  | "other-registered";

export type ChitWinnerSelection = "open-auction" | "lottery" | "fixed-rotation" | "unknown";

export type ChitDiscountDistribution =
  | "shared-everyone"
  | "shared-non-winners"
  | "unknown";

export type ChitYesNoUnknown = "yes" | "no" | "unknown";

export type ChitCommissionMode = "none" | "percentage" | "fixed";

export type ChitStatus = "active" | "archived" | "deleted";

/** Local committee / custom chit rules — stored for future V2 engine. */
export interface ChitCustomRules {
  winnerSelection: ChitWinnerSelection;
  discountDistribution: ChitDiscountDistribution;
  paymentChangesAfterAuction: ChitYesNoUnknown;
  organizerCommission: ChitYesNoUnknown;
  commissionMode?: ChitCommissionMode;
  commissionPercentage?: number;
  commissionFixedAmount?: number;
}

export interface Chit {
  id: string;
  providerType: ChitProviderType;
  registeredProvider?: RegisteredChitProviderId;
  providerName: string;
  chitName: string;
  chitValue: number;
  monthlyContribution: number;
  totalDurationMonths: number;
  startDate: string;
  currentRunningMonth: number;
  prizeReceived: boolean;
  auctionMonth?: number;
  prizeAmountReceived?: number;
  winningDiscount?: number;
  prizeNotes?: string;
  customRules?: ChitCustomRules;
  nextDueDate: string;
  status: ChitStatus;
  archivedAt?: string;
  archiveReason?: string;
  deletedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChitDerivedMetrics {
  remainingMonths: number;
  remainingContributions: number;
  totalRemainingContribution: number;
  expectedRemainingParticipation: number;
  remainingInstallments: number;
  isComplete: boolean;
  shouldSuggestArchive: boolean;
}
