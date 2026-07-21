"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppEvent, trackApplicationEvent } from "@/core/analytics";
import { ProductCreationTypeId, type ProductCreationTypeIdValue } from "@/products/creation";
import {
  getFamilyProductTypeDefinition,
  getFinancialFamilyDefinition,
  getFinancialFamilyPath,
  type FinancialFamilyIdValue
} from "@/products/families";
import { LoansScreen } from "@/features/loans/loans-screen";
import { ChitsScreen } from "@/features/chits/chits-screen";
import { ComingSoonProductTypeScreen } from "@/features/products/coming-soon-product-type-screen";

interface ProductTypeListScreenProps {
  familyId: FinancialFamilyIdValue;
  creationTypeId: ProductCreationTypeIdValue;
}

export function ProductTypeListScreen({ familyId, creationTypeId }: ProductTypeListScreenProps) {
  const productType = getFamilyProductTypeDefinition(creationTypeId);
  const hasTrackedTypeOpen = useRef(false);

  useEffect(() => {
    if (!hasTrackedTypeOpen.current) {
      hasTrackedTypeOpen.current = true;
      trackApplicationEvent(AppEvent.PRODUCT_TYPE_OPENED, {
        family_id: familyId,
        product_type: creationTypeId
      });
    }
  }, [creationTypeId, familyId]);

  if (!productType) {
    return null;
  }

  if (productType.availability === "coming-soon") {
    return <ComingSoonProductTypeScreen familyId={familyId} creationTypeId={creationTypeId} />;
  }

  if (creationTypeId === ProductCreationTypeId.CHIT) {
    return <ChitsScreen familyId={familyId} creationTypeId={creationTypeId} />;
  }

  return (
    <LoansScreen
      familyId={familyId}
      creationTypeId={creationTypeId}
      productTypeLabel={productType.label}
    />
  );
}

export function ProductTypeListHeader({
  familyId
}: {
  familyId: FinancialFamilyIdValue;
  productTypeLabel?: string;
}) {
  const family = getFinancialFamilyDefinition(familyId);

  return (
    <Link
      href={getFinancialFamilyPath(familyId)}
      className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {family?.label ?? "Products"}
    </Link>
  );
}

export { ProductTypeEmptyState } from "@/features/products/coming-soon-product-type-screen";
