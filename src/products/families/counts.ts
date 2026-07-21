import type { Chit } from "@/shared/domain/chit";
import type { Loan } from "@/shared/domain/finance";
import { ProductCreationTypeId, type ProductCreationTypeIdValue } from "@/products/creation/types";
import {
  FINANCIAL_FAMILY_CATALOG,
  FAMILY_PRODUCT_TYPES,
  listProductTypesByFamily
} from "@/products/families/catalog";
import { loanMatchesCreationType } from "@/products/families/loan-filter";
import type {
  FamilyProductTypeSummary,
  FinancialFamilyIdValue,
  FinancialFamilySummary
} from "@/products/families/types";

function isActiveLoan(loan: Loan) {
  return loan.status !== "archived" && loan.status !== "deleted";
}

function isActiveChit(chit: Chit) {
  return chit.status === "active";
}

function formatCountLabel(
  activeCount: number,
  hubCountMode: "active" | "coming-soon"
): string {
  if (hubCountMode === "coming-soon" && activeCount === 0) {
    return "Coming Soon";
  }

  if (activeCount > 0) {
    return `${activeCount} Active`;
  }

  return "None Yet";
}

function formatTypeCountLabel(activeCount: number, availability: "active" | "coming-soon"): string {
  if (availability === "coming-soon") {
    return "Coming Soon";
  }

  if (activeCount > 0) {
    return `${activeCount} Active`;
  }

  return "None Yet";
}

function countProductsForCreationType(
  creationTypeId: ProductCreationTypeIdValue,
  loans: Loan[],
  chits: Chit[]
): number {
  if (creationTypeId === ProductCreationTypeId.CHIT) {
    return chits.filter(isActiveChit).length;
  }

  return loans.filter((loan) => isActiveLoan(loan) && loanMatchesCreationType(loan, creationTypeId))
    .length;
}

function countProductsForFamily(
  familyId: FinancialFamilyIdValue,
  loans: Loan[],
  chits: Chit[]
): number {
  const types = listProductTypesByFamily(familyId);

  return types.reduce(
    (sum, type) => sum + countProductsForCreationType(type.creationTypeId, loans, chits),
    0
  );
}

export function buildFinancialFamilySummaries(
  loans: Loan[],
  chits: Chit[]
): FinancialFamilySummary[] {
  return FINANCIAL_FAMILY_CATALOG.map((family) => {
    const activeProductCount = countProductsForFamily(family.familyId, loans, chits);

    return {
      familyId: family.familyId,
      label: family.label,
      description: family.description,
      hubCountMode: family.hubCountMode,
      activeProductCount,
      countLabel: formatCountLabel(activeProductCount, family.hubCountMode),
      isNavigable: true
    };
  });
}

export function buildFamilyProductTypeSummaries(
  familyId: FinancialFamilyIdValue,
  loans: Loan[],
  chits: Chit[]
): FamilyProductTypeSummary[] {
  return listProductTypesByFamily(familyId).map((type) => {
    const activeCount = countProductsForCreationType(type.creationTypeId, loans, chits);

    return {
      creationTypeId: type.creationTypeId,
      familyId: type.familyId,
      label: type.label,
      description: type.description,
      availability: type.availability,
      activeCount,
      countLabel: formatTypeCountLabel(activeCount, type.availability)
    };
  });
}

export function getCreationTypeIdsForFamily(familyId: FinancialFamilyIdValue) {
  return FAMILY_PRODUCT_TYPES.filter((entry) => entry.familyId === familyId).map(
    (entry) => entry.creationTypeId
  );
}
