import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { LoansScreen } from "@/features/loans/loans-screen";
import { ChitsScreen } from "@/features/chits/chits-screen";
import { ComingSoonProductScreen } from "@/features/products/coming-soon-product-screen";
import { isActiveProductType, isKnownProductTypeId } from "@/products";
import { ProductTypeId } from "@/shared/domain/product";

interface ProductTypePageProps {
  params: Promise<{ productType: string }>;
}

export default async function ProductTypePage({ params }: ProductTypePageProps) {
  const { productType } = await params;

  if (!isKnownProductTypeId(productType)) {
    notFound();
  }

  if (!isActiveProductType(productType)) {
    return (
      <MobileShell>
        <ComingSoonProductScreen productTypeId={productType} />
      </MobileShell>
    );
  }

  if (productType === ProductTypeId.LOANS) {
    return (
      <MobileShell>
        <Suspense fallback={null}>
          <LoansScreen variant="standard" />
        </Suspense>
      </MobileShell>
    );
  }

  if (productType === ProductTypeId.GOLD_LOANS) {
    return (
      <MobileShell>
        <Suspense fallback={null}>
          <LoansScreen variant="gold" />
        </Suspense>
      </MobileShell>
    );
  }

  if (productType === ProductTypeId.CHITS) {
    return (
      <MobileShell>
        <Suspense fallback={null}>
          <ChitsScreen />
        </Suspense>
      </MobileShell>
    );
  }

  notFound();
}
