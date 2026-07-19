import { notFound, redirect } from "next/navigation";
import { isActiveProductType, isKnownProductTypeId } from "@/products";
import { ProductTypeId } from "@/shared/domain/product";

interface ProductNewPageProps {
  params: Promise<{ productType: string }>;
}

export default async function ProductNewPage({ params }: ProductNewPageProps) {
  const { productType } = await params;

  if (!isKnownProductTypeId(productType) || !isActiveProductType(productType)) {
    notFound();
  }

  if (productType === ProductTypeId.LOANS || productType === ProductTypeId.GOLD_LOANS) {
    redirect("/loans/new");
  }

  if (productType === ProductTypeId.CHITS) {
    redirect("/chits/new");
  }

  notFound();
}
