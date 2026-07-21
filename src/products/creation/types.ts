import type { ProductTypeIdValue } from "@/shared/domain/product";
import type { LoanType } from "@/shared/domain/finance";
import type { FinancialFamilyIdValue } from "@/products/families/types";

/** Granular product type — single source of truth for creation UX. */
export const ProductCreationTypeId = {
  HOME_LOAN: "home-loan",
  GOLD_LOAN: "gold-loan",
  PERSONAL_LOAN: "personal-loan",
  VEHICLE_LOAN: "vehicle-loan",
  EDUCATION_LOAN: "education-loan",
  LAP: "loan-against-property",
  BUSINESS_LOAN: "business-loan",
  OTHER_LOAN: "other-loan",
  CHIT: "chit",
  FIXED_DEPOSITS: "fixed-deposits",
  RECURRING_DEPOSITS: "recurring-deposits",
  PPF: "ppf",
  NPS: "nps",
  MUTUAL_FUNDS: "mutual-funds",
  STOCKS: "stocks",
  ETFS: "etfs",
  BONDS: "bonds",
  REITS: "reits",
  CRYPTO: "crypto",
  HEALTH_INSURANCE: "health-insurance",
  LIFE_INSURANCE: "life-insurance",
  TERM_INSURANCE: "term-insurance",
  VEHICLE_INSURANCE: "vehicle-insurance",
  HOME_INSURANCE: "home-insurance",
  TRAVEL_INSURANCE: "travel-insurance",
  PERSONAL_ACCIDENT_INSURANCE: "personal-accident-insurance"
} as const;

export type ProductCreationTypeIdValue =
  (typeof ProductCreationTypeId)[keyof typeof ProductCreationTypeId];

/** @deprecated Use FinancialFamilyId from @/products/families */
export const ProductCreationGroupId = {
  LOANS: "loans",
  SAVINGS: "savings",
  INVESTMENTS: "investments",
  COMMUNITY: "community-finance",
  INSURANCE: "insurance"
} as const;

export type ProductCreationGroupIdValue =
  (typeof ProductCreationGroupId)[keyof typeof ProductCreationGroupId];

export type ProductCreationAvailability = "active" | "coming-soon";

export interface ProductCreationCatalogEntry {
  creationTypeId: ProductCreationTypeIdValue;
  label: string;
  description: string;
  familyId: FinancialFamilyIdValue;
  /** @deprecated Use familyId */
  group: ProductCreationGroupIdValue;
  availability: ProductCreationAvailability;
  productTypeId: ProductTypeIdValue;
  /** Persisted loan type when entity is a loan. */
  loanType?: LoanType;
  customTypeName?: string;
}

export type ProductFormValues = Record<string, string>;

export interface ProductSaveResult {
  productTypeId: ProductTypeIdValue;
  productId: string;
  creationTypeId: ProductCreationTypeIdValue;
  redirectPath: string;
}
