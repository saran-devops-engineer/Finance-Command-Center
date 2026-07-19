/**
 * FCC V2 — Financial product domain.
 * Products are instruments (loans, chits, investments) grouped by product type.
 */

export const ProductTypeId = {
  LOANS: "loans",
  GOLD_LOANS: "gold-loans",
  CHITS: "chits",
  INVESTMENTS: "investments",
  FIXED_DEPOSITS: "fixed-deposits",
  RECURRING_DEPOSITS: "recurring-deposits",
  PPF: "ppf",
  NPS: "nps",
  INSURANCE: "insurance"
} as const;

export type ProductTypeIdValue = (typeof ProductTypeId)[keyof typeof ProductTypeId];

export const ProductAvailability = {
  ACTIVE: "active",
  COMING_SOON: "coming-soon"
} as const;

export type ProductAvailabilityValue =
  (typeof ProductAvailability)[keyof typeof ProductAvailability];

/** Minimal product reference for lists, navigation, and cross-domain linking. */
export interface ProductReference {
  id: string;
  productTypeId: ProductTypeIdValue;
  title: string;
  subtitle?: string;
  status: "active" | "archived";
}

/** Summary shown on the Products hub for each product type. */
export interface ProductTypeSummary {
  productTypeId: ProductTypeIdValue;
  label: string;
  description: string;
  availability: ProductAvailabilityValue;
  activeCount: number;
  archivedCount?: number;
}
