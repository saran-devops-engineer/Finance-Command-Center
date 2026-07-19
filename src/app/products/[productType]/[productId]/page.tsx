import { redirectToLegacyProductDetail } from "@/products";

interface ProductDetailPageProps {
  params: Promise<{ productType: string; productId: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { productType, productId } = await params;
  redirectToLegacyProductDetail(productType, productId);
}
