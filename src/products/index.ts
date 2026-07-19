export type {
  ProductCalculationEngine,
  ProductCommitmentGenerator,
  ProductInsightGenerator,
  ProductHistoryProvider,
  ProductHistoryEntry,
  ProductInsight,
  FinancialProductModule,
  ComingSoonProductModule,
  RegisteredProductModule
} from "@/products/contract";

export { isActiveProductModule } from "@/products/contract";

export type { ProductRouteConfig } from "@/products/types";

export { buildProductDetailPath, buildProductNewPath } from "@/products/types";

export {
  PRODUCT_ROUTE_CONFIG,
  PRODUCT_TYPE_CATALOG,
  isKnownProductTypeId,
  isActiveProductType,
  isComingSoonProductType,
  getProductRouteConfig,
  listRegisteredProductModules,
  getProductTypeCatalogEntry
} from "@/products/registry";

export { redirectToLegacyProductDetail } from "@/products/legacy-routes";

export {
  getProductTypeListPath,
  getLegacyProductDetailPath
} from "@/products/paths";
