/**
 * FCC V2 — Commitment domain model.
 * Commitments are recurring financial obligations (product-generated or manual).
 *
 * Distinct from `FinancialCommitment` in `@/engines/commitment` which is the
 * V1 engine projection. Phase 2+ will bridge engine output into this model.
 */

import type { ProductTypeIdValue } from "@/shared/domain/product";

export const CommitmentCategory = {
  LOAN_EMI: "loan-emi",
  GOLD_RENEWAL: "gold-renewal",
  INSURANCE_PREMIUM: "insurance-premium",
  UTILITY: "utility",
  SCHOOL_FEES: "school-fees",
  SUBSCRIPTION: "subscription",
  TAX: "tax",
  RENT: "rent",
  MANUAL_EXPENSE: "manual-expense",
  CHIT_INSTALLMENT: "chit-installment",
  OTHER: "other"
} as const;

export type CommitmentCategoryValue = (typeof CommitmentCategory)[keyof typeof CommitmentCategory];

export const CommitmentFrequency = {
  MONTHLY: "monthly",
  YEARLY: "yearly",
  QUARTERLY: "quarterly",
  WEEKLY: "weekly",
  ONE_TIME: "one-time"
} as const;

export type CommitmentFrequencyValue =
  (typeof CommitmentFrequency)[keyof typeof CommitmentFrequency];

export const CommitmentPriority = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low"
} as const;

export type CommitmentPriorityValue =
  (typeof CommitmentPriority)[keyof typeof CommitmentPriority];

export const CommitmentSourceKind = {
  PRODUCT_GENERATED: "product-generated",
  MANUAL: "manual",
  LEGACY_MIGRATED: "legacy-migrated"
} as const;

export type CommitmentSourceKindValue =
  (typeof CommitmentSourceKind)[keyof typeof CommitmentSourceKind];

export const CommitmentReviewStatus = {
  CONFIRMED: "confirmed",
  NEEDS_REVIEW: "needs-review"
} as const;

export type CommitmentReviewStatusValue =
  (typeof CommitmentReviewStatus)[keyof typeof CommitmentReviewStatus];

export interface CommitmentSource {
  kind: CommitmentSourceKindValue;
  productTypeId?: ProductTypeIdValue;
  productId?: string;
  /** V1 MoneyBreakdown field name when migrated from legacy data. */
  legacyField?: string;
}

export interface CommitmentRecord {
  id: string;
  title: string;
  category: CommitmentCategoryValue;
  amount: number;
  frequency: CommitmentFrequencyValue;
  nextDueDate: string;
  priority: CommitmentPriorityValue;
  source: CommitmentSource;
  reviewStatus: CommitmentReviewStatusValue;
  reminderEnabled: boolean;
  /** Product-generated commitments are not directly editable. */
  editable: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
