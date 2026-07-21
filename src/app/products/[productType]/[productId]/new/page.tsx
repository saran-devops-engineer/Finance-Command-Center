import { notFound } from "next/navigation";
import { MobileShell } from "@/components/layout/mobile-shell";
import { ProductFormScreen } from "@/features/products/product-form-screen";
import { parseFamilyProductTypeRoute } from "@/products/families";

interface ProductTypeNewPageProps {
  params: Promise<{ productType: string; productId: string }>;
}

export default async function ProductTypeNewPage({ params }: ProductTypeNewPageProps) {
  const { productType, productId } = await params;

  const familyTypeRoute = parseFamilyProductTypeRoute(productType, productId);
  if (!familyTypeRoute) {
    notFound();
  }

  return (
    <MobileShell>
      <ProductFormScreen
        mode="create"
        initialCreationTypeId={familyTypeRoute.creationTypeId}
        familyFilter={familyTypeRoute.familyId}
        backHref={`/products/${familyTypeRoute.familyId}/${familyTypeRoute.creationTypeId}`}
      />
    </MobileShell>
  );
}
