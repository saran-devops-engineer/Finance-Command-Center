import { Suspense } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { ProductTypeListScreen } from "@/features/products/product-type-list-screen";
import { redirectToLegacyProductDetail } from "@/products";
import { parseFamilyProductTypeRoute } from "@/products/families";

interface ProductNestedPageProps {
  params: Promise<{ productType: string; productId: string }>;
}

export default async function ProductNestedPage({ params }: ProductNestedPageProps) {
  const { productType, productId } = await params;

  const familyTypeRoute = parseFamilyProductTypeRoute(productType, productId);
  if (familyTypeRoute) {
    return (
      <MobileShell>
        <Suspense fallback={null}>
          <ProductTypeListScreen
            familyId={familyTypeRoute.familyId}
            creationTypeId={familyTypeRoute.creationTypeId}
          />
        </Suspense>
      </MobileShell>
    );
  }

  redirectToLegacyProductDetail(productType, productId);
}
