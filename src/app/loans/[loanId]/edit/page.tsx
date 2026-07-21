import { MobileShell } from "@/components/layout/mobile-shell";
import { ProductFormScreen } from "@/features/products/product-form-screen";

interface EditLoanPageProps {
  params: Promise<{
    loanId: string;
  }>;
}

export default async function EditLoanPage({ params }: EditLoanPageProps) {
  const { loanId } = await params;

  return (
    <MobileShell>
      <ProductFormScreen mode="edit" loanId={loanId} backHref={`/loans/${loanId}`} />
    </MobileShell>
  );
}
