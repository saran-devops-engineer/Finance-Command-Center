import { ProductTypeId } from "@/shared/domain/product";
import { FinancialFamilyId } from "@/products/families/types";
import {
  ProductCreationGroupId,
  ProductCreationTypeId,
  type ProductCreationCatalogEntry,
  type ProductCreationGroupIdValue,
  type ProductCreationTypeIdValue
} from "@/products/creation/types";

export const PRODUCT_CREATION_CATALOG: ProductCreationCatalogEntry[] = [
  {
    creationTypeId: ProductCreationTypeId.HOME_LOAN,
    label: "Home Loan",
    description: "Track EMI, tenure, and payoff progress.",
    familyId: FinancialFamilyId.LOANS,
    group: ProductCreationGroupId.LOANS,
    availability: "active",
    productTypeId: ProductTypeId.LOANS,
    loanType: "home"
  },
  {
    creationTypeId: ProductCreationTypeId.GOLD_LOAN,
    label: "Gold Loan",
    description: "Gold-backed loan with interest or renewal cycles.",
    familyId: FinancialFamilyId.LOANS,
    group: ProductCreationGroupId.LOANS,
    availability: "active",
    productTypeId: ProductTypeId.GOLD_LOANS,
    loanType: "gold"
  },
  {
    creationTypeId: ProductCreationTypeId.PERSONAL_LOAN,
    label: "Personal Loan",
    description: "Unsecured personal borrowing.",
    familyId: FinancialFamilyId.LOANS,
    group: ProductCreationGroupId.LOANS,
    availability: "active",
    productTypeId: ProductTypeId.LOANS,
    loanType: "personal"
  },
  {
    creationTypeId: ProductCreationTypeId.VEHICLE_LOAN,
    label: "Vehicle Loan",
    description: "Car, bike, or vehicle financing.",
    familyId: FinancialFamilyId.LOANS,
    group: ProductCreationGroupId.LOANS,
    availability: "active",
    productTypeId: ProductTypeId.LOANS,
    loanType: "vehicle"
  },
  {
    creationTypeId: ProductCreationTypeId.EDUCATION_LOAN,
    label: "Education Loan",
    description: "Education or student loan tracking.",
    familyId: FinancialFamilyId.LOANS,
    group: ProductCreationGroupId.LOANS,
    availability: "active",
    productTypeId: ProductTypeId.LOANS,
    loanType: "education"
  },
  {
    creationTypeId: ProductCreationTypeId.LAP,
    label: "Loan Against Property",
    description: "Mortgage or property-backed loan.",
    familyId: FinancialFamilyId.LOANS,
    group: ProductCreationGroupId.LOANS,
    availability: "active",
    productTypeId: ProductTypeId.LOANS,
    loanType: "custom",
    customTypeName: "Loan Against Property"
  },
  {
    creationTypeId: ProductCreationTypeId.BUSINESS_LOAN,
    label: "Business Loan",
    description: "Business or commercial borrowing.",
    familyId: FinancialFamilyId.LOANS,
    group: ProductCreationGroupId.LOANS,
    availability: "active",
    productTypeId: ProductTypeId.LOANS,
    loanType: "custom",
    customTypeName: "Business Loan"
  },
  {
    creationTypeId: ProductCreationTypeId.OTHER_LOAN,
    label: "Other Loan",
    description: "Any other loan not listed above.",
    familyId: FinancialFamilyId.LOANS,
    group: ProductCreationGroupId.LOANS,
    availability: "active",
    productTypeId: ProductTypeId.LOANS,
    loanType: "other"
  },
  {
    creationTypeId: ProductCreationTypeId.FIXED_DEPOSITS,
    label: "Fixed Deposit",
    description: "FD maturity and interest tracking.",
    familyId: FinancialFamilyId.SAVINGS,
    group: ProductCreationGroupId.SAVINGS,
    availability: "coming-soon",
    productTypeId: ProductTypeId.FIXED_DEPOSITS
  },
  {
    creationTypeId: ProductCreationTypeId.RECURRING_DEPOSITS,
    label: "Recurring Deposit",
    description: "RD installment tracking.",
    familyId: FinancialFamilyId.SAVINGS,
    group: ProductCreationGroupId.SAVINGS,
    availability: "coming-soon",
    productTypeId: ProductTypeId.RECURRING_DEPOSITS
  },
  {
    creationTypeId: ProductCreationTypeId.PPF,
    label: "PPF",
    description: "Public Provident Fund contributions.",
    familyId: FinancialFamilyId.SAVINGS,
    group: ProductCreationGroupId.SAVINGS,
    availability: "coming-soon",
    productTypeId: ProductTypeId.PPF
  },
  {
    creationTypeId: ProductCreationTypeId.NPS,
    label: "NPS",
    description: "National Pension System contributions.",
    familyId: FinancialFamilyId.SAVINGS,
    group: ProductCreationGroupId.SAVINGS,
    availability: "coming-soon",
    productTypeId: ProductTypeId.NPS
  },
  {
    creationTypeId: ProductCreationTypeId.MUTUAL_FUNDS,
    label: "Mutual Funds",
    description: "SIP and mutual fund tracking.",
    familyId: FinancialFamilyId.INVESTMENTS,
    group: ProductCreationGroupId.INVESTMENTS,
    availability: "coming-soon",
    productTypeId: ProductTypeId.INVESTMENTS
  },
  {
    creationTypeId: ProductCreationTypeId.STOCKS,
    label: "Stocks",
    description: "Equity holdings.",
    familyId: FinancialFamilyId.INVESTMENTS,
    group: ProductCreationGroupId.INVESTMENTS,
    availability: "coming-soon",
    productTypeId: ProductTypeId.INVESTMENTS
  },
  {
    creationTypeId: ProductCreationTypeId.ETFS,
    label: "ETFs",
    description: "Exchange-traded fund holdings.",
    familyId: FinancialFamilyId.INVESTMENTS,
    group: ProductCreationGroupId.INVESTMENTS,
    availability: "coming-soon",
    productTypeId: ProductTypeId.INVESTMENTS
  },
  {
    creationTypeId: ProductCreationTypeId.BONDS,
    label: "Bonds",
    description: "Fixed-income bond holdings.",
    familyId: FinancialFamilyId.INVESTMENTS,
    group: ProductCreationGroupId.INVESTMENTS,
    availability: "coming-soon",
    productTypeId: ProductTypeId.INVESTMENTS
  },
  {
    creationTypeId: ProductCreationTypeId.REITS,
    label: "REITs",
    description: "Real estate investment trust holdings.",
    familyId: FinancialFamilyId.INVESTMENTS,
    group: ProductCreationGroupId.INVESTMENTS,
    availability: "coming-soon",
    productTypeId: ProductTypeId.INVESTMENTS
  },
  {
    creationTypeId: ProductCreationTypeId.CRYPTO,
    label: "Crypto",
    description: "Digital asset tracking.",
    familyId: FinancialFamilyId.INVESTMENTS,
    group: ProductCreationGroupId.INVESTMENTS,
    availability: "coming-soon",
    productTypeId: ProductTypeId.INVESTMENTS
  },
  {
    creationTypeId: ProductCreationTypeId.CHIT,
    label: "Chit",
    description: "Chit fund contributions and prize tracking.",
    familyId: FinancialFamilyId.COMMUNITY_FINANCE,
    group: ProductCreationGroupId.COMMUNITY,
    availability: "active",
    productTypeId: ProductTypeId.CHITS
  },
  {
    creationTypeId: ProductCreationTypeId.HEALTH_INSURANCE,
    label: "Health Insurance",
    description: "Medical and health coverage policies.",
    familyId: FinancialFamilyId.INSURANCE,
    group: ProductCreationGroupId.INSURANCE,
    availability: "coming-soon",
    productTypeId: ProductTypeId.INSURANCE
  },
  {
    creationTypeId: ProductCreationTypeId.LIFE_INSURANCE,
    label: "Life Insurance",
    description: "Life coverage policies.",
    familyId: FinancialFamilyId.INSURANCE,
    group: ProductCreationGroupId.INSURANCE,
    availability: "coming-soon",
    productTypeId: ProductTypeId.INSURANCE
  },
  {
    creationTypeId: ProductCreationTypeId.TERM_INSURANCE,
    label: "Term Insurance",
    description: "Term life coverage policies.",
    familyId: FinancialFamilyId.INSURANCE,
    group: ProductCreationGroupId.INSURANCE,
    availability: "coming-soon",
    productTypeId: ProductTypeId.INSURANCE
  },
  {
    creationTypeId: ProductCreationTypeId.VEHICLE_INSURANCE,
    label: "Vehicle Insurance",
    description: "Motor and vehicle coverage.",
    familyId: FinancialFamilyId.INSURANCE,
    group: ProductCreationGroupId.INSURANCE,
    availability: "coming-soon",
    productTypeId: ProductTypeId.INSURANCE
  },
  {
    creationTypeId: ProductCreationTypeId.HOME_INSURANCE,
    label: "Home Insurance",
    description: "Property and home coverage.",
    familyId: FinancialFamilyId.INSURANCE,
    group: ProductCreationGroupId.INSURANCE,
    availability: "coming-soon",
    productTypeId: ProductTypeId.INSURANCE
  },
  {
    creationTypeId: ProductCreationTypeId.TRAVEL_INSURANCE,
    label: "Travel Insurance",
    description: "Travel and trip coverage.",
    familyId: FinancialFamilyId.INSURANCE,
    group: ProductCreationGroupId.INSURANCE,
    availability: "coming-soon",
    productTypeId: ProductTypeId.INSURANCE
  },
  {
    creationTypeId: ProductCreationTypeId.PERSONAL_ACCIDENT_INSURANCE,
    label: "Personal Accident Insurance",
    description: "Accident and disability coverage.",
    familyId: FinancialFamilyId.INSURANCE,
    group: ProductCreationGroupId.INSURANCE,
    availability: "coming-soon",
    productTypeId: ProductTypeId.INSURANCE
  }
];

export const PRODUCT_CREATION_GROUP_LABELS: Record<ProductCreationGroupIdValue, string> = {
  [ProductCreationGroupId.LOANS]: "Loans",
  [ProductCreationGroupId.SAVINGS]: "Savings",
  [ProductCreationGroupId.INVESTMENTS]: "Investments",
  [ProductCreationGroupId.COMMUNITY]: "Community Finance",
  [ProductCreationGroupId.INSURANCE]: "Insurance"
};

export function getCreationCatalogEntry(creationTypeId: ProductCreationTypeIdValue) {
  return PRODUCT_CREATION_CATALOG.find((entry) => entry.creationTypeId === creationTypeId);
}

export function listCreationCatalogByGroup(group: ProductCreationGroupIdValue) {
  return PRODUCT_CREATION_CATALOG.filter((entry) => entry.group === group);
}

export function listCreationCatalogByFamily(familyId: string) {
  return PRODUCT_CREATION_CATALOG.filter((entry) => entry.familyId === familyId);
}

export function resolveCreationTypeFromLoanType(
  type: string,
  customTypeName?: string
): ProductCreationTypeIdValue {
  if (type === "home") return ProductCreationTypeId.HOME_LOAN;
  if (type === "gold") return ProductCreationTypeId.GOLD_LOAN;
  if (type === "personal") return ProductCreationTypeId.PERSONAL_LOAN;
  if (type === "vehicle") return ProductCreationTypeId.VEHICLE_LOAN;
  if (type === "education") return ProductCreationTypeId.EDUCATION_LOAN;
  if (type === "custom" && customTypeName === "Loan Against Property") {
    return ProductCreationTypeId.LAP;
  }
  if (type === "custom" && customTypeName === "Business Loan") {
    return ProductCreationTypeId.BUSINESS_LOAN;
  }
  if (type === "other") return ProductCreationTypeId.OTHER_LOAN;
  return ProductCreationTypeId.OTHER_LOAN;
}
