"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { card, spacing } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { getProductTypeCatalogEntry } from "@/products";
import type { ProductTypeIdValue } from "@/shared/domain/product";

interface ComingSoonProductScreenProps {
  productTypeId: ProductTypeIdValue;
}

export function ComingSoonProductScreen({ productTypeId }: ComingSoonProductScreenProps) {
  const entry = getProductTypeCatalogEntry(productTypeId);

  return (
    <div className={spacing.page}>
      <header className="space-y-2 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Products
        </p>
        <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
          {entry?.pluralLabel ?? "Product"}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {entry?.description ?? "This product type is not available yet."}
        </p>
      </header>

      <Card className={cn(card.paddingCompact, "space-y-4")}>
        <p className="text-sm leading-6 text-muted-foreground">
          The architecture placeholder for {entry?.label ?? "this product"} is ready. Full product
          implementation will arrive in a future release.
        </p>
        <Button asChild variant="secondary" className="w-full">
          <Link href="/products">Back to Products</Link>
        </Button>
      </Card>
    </div>
  );
}
