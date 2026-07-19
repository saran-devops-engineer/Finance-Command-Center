import type { ProductTypeIdValue } from "@/shared/domain/product";

/** Legacy route mapping — preserved for backward compatibility during V2 transition. */
export interface ProductRouteConfig {
  productTypeId: ProductTypeIdValue;
  /** Canonical V2 list route under /products */
  listPath: string;
  /** Legacy list route that continues to work */
  legacyListPath?: string;
  /** Path template for product detail — `{id}` replaced at runtime */
  detailPathTemplate: string;
  /** Legacy detail path template */
  legacyDetailPathTemplate?: string;
  newPathTemplate?: string;
}

export function buildProductDetailPath(template: string, productId: string): string {
  return template.replace("{id}", productId);
}

export function buildProductNewPath(listPath: string): string {
  return `${listPath}/new`;
}
