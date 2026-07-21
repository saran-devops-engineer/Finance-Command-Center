import type { ProductCreationTypeIdValue } from "@/products/creation/types";

/** Frozen top-level financial families — do not add without product review. */
export const FinancialFamilyId = {
  LOANS: "loans",
  SAVINGS: "savings",
  INVESTMENTS: "investments",
  COMMUNITY_FINANCE: "community-finance",
  INSURANCE: "insurance"
} as const;

export type FinancialFamilyIdValue =
  (typeof FinancialFamilyId)[keyof typeof FinancialFamilyId];

export type FamilyHubCountMode = "active" | "coming-soon";

export interface FinancialFamilyDefinition {
  familyId: FinancialFamilyIdValue;
  label: string;
  description: string;
  /** How the Products hub displays count when no products exist. */
  hubCountMode: FamilyHubCountMode;
  /** Empty-state copy when no products exist in this family. */
  emptyStateMessage: string;
}

export interface FamilyProductTypeDefinition {
  creationTypeId: ProductCreationTypeIdValue;
  familyId: FinancialFamilyIdValue;
  label: string;
  description: string;
  availability: "active" | "coming-soon";
}

export interface FinancialFamilySummary {
  familyId: FinancialFamilyIdValue;
  label: string;
  description: string;
  hubCountMode: FamilyHubCountMode;
  activeProductCount: number;
  countLabel: string;
  isNavigable: boolean;
}

export interface FamilyProductTypeSummary {
  creationTypeId: ProductCreationTypeIdValue;
  familyId: FinancialFamilyIdValue;
  label: string;
  description: string;
  availability: "active" | "coming-soon";
  activeCount: number;
  countLabel: string;
}
