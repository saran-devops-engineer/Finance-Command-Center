import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { FamilyScreen } from "@/features/products/family-screen";
import {
  isFinancialFamilyId,
  resolveLegacyProductTypeRedirectIfNeeded
} from "@/products/families";

interface ProductFamilyPageProps {
  params: Promise<{ productType: string }>;
}

function FamilyPageFallback() {
  return (
    <div className="px-5 pb-8 pt-4">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
        Loading
      </p>
      <h1 className="mt-2 font-display text-4xl leading-tight tracking-[-0.04em]">
        Opening products.
      </h1>
    </div>
  );
}

export default async function ProductFamilyPage({ params }: ProductFamilyPageProps) {
  const { productType } = await params;
  const currentPath = `/products/${productType}`;

  const legacyRedirect = resolveLegacyProductTypeRedirectIfNeeded(productType, currentPath);
  if (legacyRedirect) {
    redirect(legacyRedirect);
  }

  if (!isFinancialFamilyId(productType)) {
    notFound();
  }

  return (
    <MobileShell>
      <Suspense fallback={<FamilyPageFallback />}>
        <FamilyScreen familyId={productType} />
      </Suspense>
    </MobileShell>
  );
}
