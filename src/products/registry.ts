import { ProductTypeId, ProductAvailability } from "@/shared/domain/product";
import type { ProductTypeIdValue } from "@/shared/domain/product";
import type { ComingSoonProductModule, RegisteredProductModule } from "@/products/contract";
import type { ProductRouteConfig } from "@/products/types";

const COMING_SOON_MODULES: ComingSoonProductModule[] = [
  {
    productTypeId: ProductTypeId.INVESTMENTS,
    label: "Investments",
    pluralLabel: "Investments",
    description: "Track stocks, mutual funds, and other investments.",
    availability: "coming-soon"
  },
  {
    productTypeId: ProductTypeId.FIXED_DEPOSITS,
    label: "Fixed Deposit",
    pluralLabel: "Fixed Deposits",
    description: "Track FD maturity and interest payouts.",
    availability: "coming-soon"
  },
  {
    productTypeId: ProductTypeId.RECURRING_DEPOSITS,
    label: "Recurring Deposit",
    pluralLabel: "Recurring Deposits",
    description: "Track RD installments and maturity.",
    availability: "coming-soon"
  },
  {
    productTypeId: ProductTypeId.PPF,
    label: "PPF",
    pluralLabel: "PPF Accounts",
    description: "Track Public Provident Fund contributions.",
    availability: "coming-soon"
  },
  {
    productTypeId: ProductTypeId.NPS,
    label: "NPS",
    pluralLabel: "NPS Accounts",
    description: "Track National Pension System contributions.",
    availability: "coming-soon"
  },
  {
    productTypeId: ProductTypeId.INSURANCE,
    label: "Insurance",
    pluralLabel: "Insurance Policies",
    description: "Track policy premiums and renewals.",
    availability: "coming-soon"
  }
];

/** Active product types with full engine wiring — registered in Phase 4+. */
const ACTIVE_PRODUCT_TYPE_IDS: ProductTypeIdValue[] = [
  ProductTypeId.LOANS,
  ProductTypeId.GOLD_LOANS,
  ProductTypeId.CHITS
];

export const PRODUCT_ROUTE_CONFIG: Record<ProductTypeIdValue, ProductRouteConfig> = {
  [ProductTypeId.LOANS]: {
    productTypeId: ProductTypeId.LOANS,
    listPath: "/products/loans",
    legacyListPath: "/loans",
    detailPathTemplate: "/products/loans/{id}",
    legacyDetailPathTemplate: "/loans/{id}",
    newPathTemplate: "/products/loans/new"
  },
  [ProductTypeId.GOLD_LOANS]: {
    productTypeId: ProductTypeId.GOLD_LOANS,
    listPath: "/products/gold-loans",
    legacyListPath: "/loans?view=gold",
    detailPathTemplate: "/products/gold-loans/{id}",
    legacyDetailPathTemplate: "/loans/{id}",
    newPathTemplate: "/products/gold-loans/new"
  },
  [ProductTypeId.CHITS]: {
    productTypeId: ProductTypeId.CHITS,
    listPath: "/products/chits",
    legacyListPath: "/chits",
    detailPathTemplate: "/products/chits/{id}",
    legacyDetailPathTemplate: "/chits/{id}",
    newPathTemplate: "/products/chits/new"
  },
  [ProductTypeId.INVESTMENTS]: {
    productTypeId: ProductTypeId.INVESTMENTS,
    listPath: "/products/investments",
    detailPathTemplate: "/products/investments/{id}"
  },
  [ProductTypeId.FIXED_DEPOSITS]: {
    productTypeId: ProductTypeId.FIXED_DEPOSITS,
    listPath: "/products/fixed-deposits",
    detailPathTemplate: "/products/fixed-deposits/{id}"
  },
  [ProductTypeId.RECURRING_DEPOSITS]: {
    productTypeId: ProductTypeId.RECURRING_DEPOSITS,
    listPath: "/products/recurring-deposits",
    detailPathTemplate: "/products/recurring-deposits/{id}"
  },
  [ProductTypeId.PPF]: {
    productTypeId: ProductTypeId.PPF,
    listPath: "/products/ppf",
    detailPathTemplate: "/products/ppf/{id}"
  },
  [ProductTypeId.NPS]: {
    productTypeId: ProductTypeId.NPS,
    listPath: "/products/nps",
    detailPathTemplate: "/products/nps/{id}"
  },
  [ProductTypeId.INSURANCE]: {
    productTypeId: ProductTypeId.INSURANCE,
    listPath: "/products/insurance",
    detailPathTemplate: "/products/insurance/{id}"
  }
};

export const PRODUCT_TYPE_CATALOG: Array<{
  productTypeId: ProductTypeIdValue;
  label: string;
  pluralLabel: string;
  description: string;
  availability: typeof ProductAvailability.ACTIVE | typeof ProductAvailability.COMING_SOON;
}> = [
  {
    productTypeId: ProductTypeId.LOANS,
    label: "Loan",
    pluralLabel: "Loans",
    description: "Home, personal, vehicle, and other loans.",
    availability: ProductAvailability.ACTIVE
  },
  {
    productTypeId: ProductTypeId.GOLD_LOANS,
    label: "Gold Loan",
    pluralLabel: "Gold Loans",
    description: "Gold-backed loans with interest or renewal cycles.",
    availability: ProductAvailability.ACTIVE
  },
  {
    productTypeId: ProductTypeId.CHITS,
    label: "Chit",
    pluralLabel: "Chits",
    description: "Chit fund contributions and prize tracking.",
    availability: ProductAvailability.ACTIVE
  },
  ...COMING_SOON_MODULES.map((module) => ({
    productTypeId: module.productTypeId,
    label: module.label,
    pluralLabel: module.pluralLabel,
    description: module.description,
    availability: ProductAvailability.COMING_SOON
  }))
];

export function isKnownProductTypeId(value: string): value is ProductTypeIdValue {
  return value in PRODUCT_ROUTE_CONFIG;
}

export function isActiveProductType(productTypeId: ProductTypeIdValue): boolean {
  return ACTIVE_PRODUCT_TYPE_IDS.includes(productTypeId);
}

export function isComingSoonProductType(productTypeId: ProductTypeIdValue): boolean {
  return !isActiveProductType(productTypeId);
}

export function getProductRouteConfig(productTypeId: ProductTypeIdValue): ProductRouteConfig {
  return PRODUCT_ROUTE_CONFIG[productTypeId];
}

export function listRegisteredProductModules(): RegisteredProductModule[] {
  return COMING_SOON_MODULES;
}

export function getProductTypeCatalogEntry(productTypeId: ProductTypeIdValue) {
  return PRODUCT_TYPE_CATALOG.find((entry) => entry.productTypeId === productTypeId);
}
