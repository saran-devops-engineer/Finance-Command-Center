import type { ProductTypeIdValue } from "@/shared/domain/product";
import { getProductRouteConfig } from "@/products/registry";
import { buildProductDetailPath } from "@/products/types";

export function getProductTypeListPath(productTypeId: ProductTypeIdValue): string {
  return getProductRouteConfig(productTypeId).listPath;
}

export function getLegacyProductDetailPath(
  productTypeId: ProductTypeIdValue,
  productId: string
): string | null {
  const config = getProductRouteConfig(productTypeId);
  if (!config.legacyDetailPathTemplate) {
    return null;
  }

  return buildProductDetailPath(config.legacyDetailPathTemplate, productId);
}
