import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { FamilyScreen } from "@/features/products/family-screen";
import {
  isFinancialFamilyId,
  resolveLegacyProductTypeRedirect
} from "@/products/families";

interface ProductFamilyPageProps {
  params: Promise<{ productType: string }>;
}

export default async function ProductFamilyPage({ params }: ProductFamilyPageProps) {
  const { productType } = await params;

  const legacyRedirect = resolveLegacyProductTypeRedirect(productType);
  if (legacyRedirect) {
    redirect(legacyRedirect);
  }

  if (!isFinancialFamilyId(productType)) {
    notFound();
  }

  return (
    <MobileShell>
      <Suspense fallback={null}>
        <FamilyScreen familyId={productType} />
      </Suspense>
    </MobileShell>
  );
}
