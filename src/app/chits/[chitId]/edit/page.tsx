import { MobileShell } from "@/components/layout/mobile-shell";
import { ProductFormScreen } from "@/features/products/product-form-screen";

interface EditChitPageProps {
  params: Promise<{ chitId: string }>;
}

export default async function EditChitPage({ params }: EditChitPageProps) {
  const { chitId } = await params;

  return (
    <MobileShell>
      <ProductFormScreen mode="edit" chitId={chitId} backHref={`/chits/${chitId}`} />
    </MobileShell>
  );
}
