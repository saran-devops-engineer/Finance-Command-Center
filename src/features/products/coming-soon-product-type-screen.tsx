"use client";

import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { spacing } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  getFamilyProductTypeNewPath,
  getFinancialFamilyDefinition,
  getFinancialFamilyPath,
  type FinancialFamilyIdValue
} from "@/products/families";
import type { ProductCreationTypeIdValue } from "@/products/creation";
import { getFamilyProductTypeDefinition } from "@/products/families";

interface ComingSoonProductTypeScreenProps {
  familyId: FinancialFamilyIdValue;
  creationTypeId: ProductCreationTypeIdValue;
}

export function ComingSoonProductTypeScreen({
  familyId,
  creationTypeId
}: ComingSoonProductTypeScreenProps) {
  const family = getFinancialFamilyDefinition(familyId);
  const productType = getFamilyProductTypeDefinition(creationTypeId);

  return (
    <div className={spacing.page}>
      <header className="space-y-3 pt-4">
        <Link
          href={getFinancialFamilyPath(familyId)}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {family?.label ?? "Products"}
        </Link>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            {family?.label}
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            {productType?.label ?? "Product"}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {productType?.description ?? "This product type is not available yet."}
          </p>
        </div>
      </header>

      <Card className={cn("space-y-4 p-5")}>
        <p className="text-sm leading-6 text-muted-foreground">
          The architecture placeholder for {productType?.label ?? "this product"} is ready. Full
          product implementation will arrive in a future release.
        </p>
        <Button asChild variant="secondary" className="w-full">
          <Link href={getFinancialFamilyPath(familyId)}>Back to {family?.label}</Link>
        </Button>
      </Card>
    </div>
  );
}

interface ProductTypeEmptyStateProps {
  familyId: FinancialFamilyIdValue;
  creationTypeId: ProductCreationTypeIdValue;
  message: string;
}

export function ProductTypeEmptyState({
  familyId,
  creationTypeId,
  message
}: ProductTypeEmptyStateProps) {
  const productType = getFamilyProductTypeDefinition(creationTypeId);

  return (
    <Card className="space-y-4 p-5 text-center">
      <p className="text-sm leading-6 text-muted-foreground">{message}</p>
      <Button asChild className="w-full">
        <Link href={getFamilyProductTypeNewPath(familyId, creationTypeId)}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Add {productType?.label ?? "Product"}
        </Link>
      </Button>
    </Card>
  );
}
