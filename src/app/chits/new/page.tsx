import { MobileShell } from "@/components/layout/mobile-shell";
import { ProductFormScreen } from "@/features/products/product-form-screen";
import { ProductCreationTypeId } from "@/products/creation";

export default function NewChitPage() {
  return (
    <MobileShell>
      <ProductFormScreen
        mode="create"
        initialCreationTypeId={ProductCreationTypeId.CHIT}
        backHref="/chits"
      />
    </MobileShell>
  );
}
