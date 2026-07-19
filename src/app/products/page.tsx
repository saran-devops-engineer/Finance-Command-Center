import { Suspense } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { ProductsScreen } from "@/features/products/products-screen";

export default function ProductsPage() {
  return (
    <MobileShell>
      <Suspense fallback={null}>
        <ProductsScreen />
      </Suspense>
    </MobileShell>
  );
}
