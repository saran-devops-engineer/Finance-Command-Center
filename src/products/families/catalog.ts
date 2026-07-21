import { ProductCreationTypeId } from "@/products/creation/types";
import {
  FinancialFamilyId,
  type FamilyProductTypeDefinition,
  type FinancialFamilyDefinition,
  type FinancialFamilyIdValue
} from "@/products/families/types";

/** Frozen five-family hierarchy for the Products module. */
export const FINANCIAL_FAMILY_CATALOG: FinancialFamilyDefinition[] = [
  {
    familyId: FinancialFamilyId.LOANS,
    label: "Loans",
    description: "Home, gold, vehicle, personal, and other borrowing.",
    hubCountMode: "active",
    emptyStateMessage: "No loan products added yet."
  },
  {
    familyId: FinancialFamilyId.SAVINGS,
    label: "Savings",
    description: "Fixed deposits, recurring deposits, PPF, NPS, and sovereign savings.",
    hubCountMode: "active",
    emptyStateMessage: "No savings products added yet."
  },
  {
    familyId: FinancialFamilyId.INVESTMENTS,
    label: "Investments",
    description: "Mutual funds, stocks, ETFs, bonds, and other growth assets.",
    hubCountMode: "coming-soon",
    emptyStateMessage: "Investment tracking is coming soon."
  },
  {
    familyId: FinancialFamilyId.COMMUNITY_FINANCE,
    label: "Community Finance",
    description: "Chit funds and community-based financial instruments.",
    hubCountMode: "active",
    emptyStateMessage: "No community finance products added yet."
  },
  {
    familyId: FinancialFamilyId.INSURANCE,
    label: "Insurance",
    description: "Health, life, term, vehicle, and other insurance policies.",
    hubCountMode: "coming-soon",
    emptyStateMessage: "Insurance tracking is coming soon."
  }
];

/** Product types owned by each financial family. */
export const FAMILY_PRODUCT_TYPES: FamilyProductTypeDefinition[] = [
  {
    creationTypeId: ProductCreationTypeId.HOME_LOAN,
    familyId: FinancialFamilyId.LOANS,
    label: "Home Loan",
    description: "Track EMI, tenure, and payoff progress.",
    availability: "active"
  },
  {
    creationTypeId: ProductCreationTypeId.GOLD_LOAN,
    familyId: FinancialFamilyId.LOANS,
    label: "Gold Loan",
    description: "Gold-backed loan with interest or renewal cycles.",
    availability: "active"
  },
  {
    creationTypeId: ProductCreationTypeId.VEHICLE_LOAN,
    familyId: FinancialFamilyId.LOANS,
    label: "Vehicle Loan",
    description: "Car, bike, or vehicle financing.",
    availability: "active"
  },
  {
    creationTypeId: ProductCreationTypeId.PERSONAL_LOAN,
    familyId: FinancialFamilyId.LOANS,
    label: "Personal Loan",
    description: "Unsecured personal borrowing.",
    availability: "active"
  },
  {
    creationTypeId: ProductCreationTypeId.EDUCATION_LOAN,
    familyId: FinancialFamilyId.LOANS,
    label: "Education Loan",
    description: "Education or student loan tracking.",
    availability: "active"
  },
  {
    creationTypeId: ProductCreationTypeId.BUSINESS_LOAN,
    familyId: FinancialFamilyId.LOANS,
    label: "Business Loan",
    description: "Business or commercial borrowing.",
    availability: "active"
  },
  {
    creationTypeId: ProductCreationTypeId.LAP,
    familyId: FinancialFamilyId.LOANS,
    label: "Loan Against Property",
    description: "Mortgage or property-backed loan.",
    availability: "active"
  },
  {
    creationTypeId: ProductCreationTypeId.OTHER_LOAN,
    familyId: FinancialFamilyId.LOANS,
    label: "Other Loan",
    description: "Any other loan not listed above.",
    availability: "active"
  },
  {
    creationTypeId: ProductCreationTypeId.FIXED_DEPOSITS,
    familyId: FinancialFamilyId.SAVINGS,
    label: "Fixed Deposit",
    description: "FD maturity and interest tracking.",
    availability: "coming-soon"
  },
  {
    creationTypeId: ProductCreationTypeId.RECURRING_DEPOSITS,
    familyId: FinancialFamilyId.SAVINGS,
    label: "Recurring Deposit",
    description: "RD installment tracking.",
    availability: "coming-soon"
  },
  {
    creationTypeId: ProductCreationTypeId.PPF,
    familyId: FinancialFamilyId.SAVINGS,
    label: "PPF",
    description: "Public Provident Fund contributions.",
    availability: "coming-soon"
  },
  {
    creationTypeId: ProductCreationTypeId.NPS,
    familyId: FinancialFamilyId.SAVINGS,
    label: "NPS",
    description: "National Pension System contributions.",
    availability: "coming-soon"
  },
  {
    creationTypeId: ProductCreationTypeId.MUTUAL_FUNDS,
    familyId: FinancialFamilyId.INVESTMENTS,
    label: "Mutual Funds",
    description: "SIP and mutual fund tracking.",
    availability: "coming-soon"
  },
  {
    creationTypeId: ProductCreationTypeId.STOCKS,
    familyId: FinancialFamilyId.INVESTMENTS,
    label: "Stocks",
    description: "Equity holdings.",
    availability: "coming-soon"
  },
  {
    creationTypeId: ProductCreationTypeId.ETFS,
    familyId: FinancialFamilyId.INVESTMENTS,
    label: "ETFs",
    description: "Exchange-traded fund holdings.",
    availability: "coming-soon"
  },
  {
    creationTypeId: ProductCreationTypeId.BONDS,
    familyId: FinancialFamilyId.INVESTMENTS,
    label: "Bonds",
    description: "Fixed-income bond holdings.",
    availability: "coming-soon"
  },
  {
    creationTypeId: ProductCreationTypeId.REITS,
    familyId: FinancialFamilyId.INVESTMENTS,
    label: "REITs",
    description: "Real estate investment trust holdings.",
    availability: "coming-soon"
  },
  {
    creationTypeId: ProductCreationTypeId.CRYPTO,
    familyId: FinancialFamilyId.INVESTMENTS,
    label: "Crypto",
    description: "Digital asset tracking.",
    availability: "coming-soon"
  },
  {
    creationTypeId: ProductCreationTypeId.CHIT,
    familyId: FinancialFamilyId.COMMUNITY_FINANCE,
    label: "Chit",
    description: "Chit fund contributions and prize tracking.",
    availability: "active"
  },
  {
    creationTypeId: ProductCreationTypeId.HEALTH_INSURANCE,
    familyId: FinancialFamilyId.INSURANCE,
    label: "Health Insurance",
    description: "Medical and health coverage policies.",
    availability: "coming-soon"
  },
  {
    creationTypeId: ProductCreationTypeId.LIFE_INSURANCE,
    familyId: FinancialFamilyId.INSURANCE,
    label: "Life Insurance",
    description: "Life coverage policies.",
    availability: "coming-soon"
  },
  {
    creationTypeId: ProductCreationTypeId.TERM_INSURANCE,
    familyId: FinancialFamilyId.INSURANCE,
    label: "Term Insurance",
    description: "Term life coverage policies.",
    availability: "coming-soon"
  },
  {
    creationTypeId: ProductCreationTypeId.VEHICLE_INSURANCE,
    familyId: FinancialFamilyId.INSURANCE,
    label: "Vehicle Insurance",
    description: "Motor and vehicle coverage.",
    availability: "coming-soon"
  },
  {
    creationTypeId: ProductCreationTypeId.HOME_INSURANCE,
    familyId: FinancialFamilyId.INSURANCE,
    label: "Home Insurance",
    description: "Property and home coverage.",
    availability: "coming-soon"
  },
  {
    creationTypeId: ProductCreationTypeId.TRAVEL_INSURANCE,
    familyId: FinancialFamilyId.INSURANCE,
    label: "Travel Insurance",
    description: "Travel and trip coverage.",
    availability: "coming-soon"
  },
  {
    creationTypeId: ProductCreationTypeId.PERSONAL_ACCIDENT_INSURANCE,
    familyId: FinancialFamilyId.INSURANCE,
    label: "Personal Accident Insurance",
    description: "Accident and disability coverage.",
    availability: "coming-soon"
  }
];

export const FINANCIAL_FAMILY_LABELS: Record<FinancialFamilyIdValue, string> =
  Object.fromEntries(
    FINANCIAL_FAMILY_CATALOG.map((entry) => [entry.familyId, entry.label])
  ) as Record<FinancialFamilyIdValue, string>;

export function isFinancialFamilyId(value: string): value is FinancialFamilyIdValue {
  return Object.values(FinancialFamilyId).includes(value as FinancialFamilyIdValue);
}

export function getFinancialFamilyDefinition(familyId: FinancialFamilyIdValue) {
  return FINANCIAL_FAMILY_CATALOG.find((entry) => entry.familyId === familyId);
}

export function listProductTypesByFamily(familyId: FinancialFamilyIdValue) {
  return FAMILY_PRODUCT_TYPES.filter((entry) => entry.familyId === familyId);
}

export function getFamilyProductTypeDefinition(creationTypeId: string) {
  return FAMILY_PRODUCT_TYPES.find((entry) => entry.creationTypeId === creationTypeId);
}

export function getFamilyIdForCreationType(creationTypeId: string): FinancialFamilyIdValue | null {
  return getFamilyProductTypeDefinition(creationTypeId)?.familyId ?? null;
}
