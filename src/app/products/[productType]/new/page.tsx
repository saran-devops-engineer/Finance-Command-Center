import { notFound, redirect } from "next/navigation";
import { MobileShell } from "@/components/layout/mobile-shell";
import { ProductFormScreen } from "@/features/products/product-form-screen";
import {
  isFinancialFamilyId,
  resolveLegacyProductTypeNewRedirect
} from "@/products/families";
import type { FinancialFamilyIdValue } from "@/products/families";

interface ProductFamilyNewPageProps {
  params: Promise<{ productType: string }>;
}

export default async function ProductFamilyNewPage({ params }: ProductFamilyNewPageProps) {
  const { productType } = await params;

  const legacyRedirect = resolveLegacyProductTypeNewRedirect(productType);
  if (legacyRedirect && !isFinancialFamilyId(productType)) {
    redirect(legacyRedirect);
  }

  if (!isFinancialFamilyId(productType)) {
    notFound();
  }

  const familyId = productType as FinancialFamilyIdValue;

  return (
    <MobileShell>
      <ProductFormScreen
        mode="create"
        familyFilter={familyId}
        backHref={`/products/${familyId}`}
      />
    </MobileShell>
  );
}
