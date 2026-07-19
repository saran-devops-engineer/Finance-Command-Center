import { notFound, redirect } from "next/navigation";
import { isKnownProductTypeId } from "@/products/registry";
import { getLegacyProductDetailPath } from "@/products/paths";

export function redirectToLegacyProductDetail(productType: string, productId: string): never {
  if (!isKnownProductTypeId(productType)) {
    notFound();
  }

  const legacyPath = getLegacyProductDetailPath(productType, productId);
  if (!legacyPath) {
    notFound();
  }

  redirect(legacyPath);
}
