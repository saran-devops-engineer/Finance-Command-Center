import { MobileShell } from "@/components/layout/mobile-shell";
import { ProductFormScreen } from "@/features/products/product-form-screen";
import { FinancialFamilyId } from "@/products/families";

export default function AddLoanPage() {
  return (
    <MobileShell>
      <ProductFormScreen
        mode="create"
        familyFilter={FinancialFamilyId.LOANS}
        backHref="/loans"
      />
    </MobileShell>
  );
}
