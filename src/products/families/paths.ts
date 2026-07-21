import { ProductTypeId } from "@/shared/domain/product";
import type { ProductCreationTypeIdValue } from "@/products/creation/types";
import {
  getFamilyProductTypeDefinition,
  isFinancialFamilyId
} from "@/products/families/catalog";
import type { FinancialFamilyIdValue } from "@/products/families/types";

export function getFinancialFamilyPath(familyId: FinancialFamilyIdValue): string {
  return `/products/${familyId}`;
}

export function getFamilyProductTypePath(
  familyId: FinancialFamilyIdValue,
  creationTypeId: ProductCreationTypeIdValue
): string {
  return `/products/${familyId}/${creationTypeId}`;
}

export function getFamilyProductTypeNewPath(
  familyId: FinancialFamilyIdValue,
  creationTypeId: ProductCreationTypeIdValue
): string {
  return `/products/${familyId}/${creationTypeId}/new`;
}

export function getAddFinancialProductPath(familyId?: FinancialFamilyIdValue | null): string {
  if (familyId) {
    return `/products/new?family=${familyId}`;
  }

  return "/products/new";
}

/** Legacy product-type list paths → V3 family navigation. */
const LEGACY_PRODUCT_TYPE_REDIRECTS: Record<string, string> = {
  [ProductTypeId.LOANS]: getFinancialFamilyPath("loans"),
  [ProductTypeId.GOLD_LOANS]: getFamilyProductTypePath("loans", "gold-loan"),
  [ProductTypeId.CHITS]: getFamilyProductTypePath("community-finance", "chit"),
  [ProductTypeId.INVESTMENTS]: getFinancialFamilyPath("investments"),
  [ProductTypeId.FIXED_DEPOSITS]: getFinancialFamilyPath("savings"),
  [ProductTypeId.RECURRING_DEPOSITS]: getFinancialFamilyPath("savings"),
  [ProductTypeId.PPF]: getFinancialFamilyPath("savings"),
  [ProductTypeId.NPS]: getFinancialFamilyPath("savings"),
  [ProductTypeId.INSURANCE]: getFinancialFamilyPath("insurance")
};

const LEGACY_PRODUCT_TYPE_NEW_REDIRECTS: Record<string, string> = {
  [ProductTypeId.GOLD_LOANS]: getFamilyProductTypeNewPath("loans", "gold-loan"),
  [ProductTypeId.CHITS]: getFamilyProductTypeNewPath("community-finance", "chit"),
  [ProductTypeId.LOANS]: getAddFinancialProductPath("loans")
};

export function resolveLegacyProductTypeRedirect(segment: string): string | null {
  return LEGACY_PRODUCT_TYPE_REDIRECTS[segment] ?? null;
}

export function resolveLegacyProductTypeNewRedirect(segment: string): string | null {
  return LEGACY_PRODUCT_TYPE_NEW_REDIRECTS[segment] ?? resolveLegacyProductTypeRedirect(segment);
}

export function parseFamilyRouteSegment(segment: string): FinancialFamilyIdValue | null {
  return isFinancialFamilyId(segment) ? segment : null;
}

export function parseFamilyProductTypeRoute(
  familySegment: string,
  typeSegment: string
): { familyId: FinancialFamilyIdValue; creationTypeId: ProductCreationTypeIdValue } | null {
  if (!isFinancialFamilyId(familySegment)) {
    return null;
  }

  const typeDefinition = getFamilyProductTypeDefinition(typeSegment);
  if (!typeDefinition || typeDefinition.familyId !== familySegment) {
    return null;
  }

  return {
    familyId: familySegment,
    creationTypeId: typeDefinition.creationTypeId
  };
}
