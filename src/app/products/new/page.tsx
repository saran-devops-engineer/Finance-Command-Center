import { Suspense } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { ProductFormScreen } from "@/features/products/product-form-screen";

interface NewProductPageProps {
  searchParams: Promise<{ family?: string }>;
}

export default async function NewProductPage({ searchParams }: NewProductPageProps) {
  const { family } = await searchParams;

  return (
    <MobileShell>
      <Suspense fallback={null}>
        <ProductFormScreen
          mode="create"
          backHref="/products"
          familyFilter={family ?? null}
        />
      </Suspense>
    </MobileShell>
  );
}
