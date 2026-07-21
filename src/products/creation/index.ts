/** Side-effect imports register all product creation definitions. */
import "@/products/definitions/home-loan/definition";
import "@/products/definitions/standard-loan/definition";
import "@/products/definitions/dedicated/definition";

export {
  getProductCreationDefinition,
  requireProductCreationDefinition,
  listProductCreationDefinitions,
  registerProductCreationDefinition
} from "@/products/creation/definition";

export {
  PRODUCT_CREATION_CATALOG,
  PRODUCT_CREATION_GROUP_LABELS,
  getCreationCatalogEntry,
  listCreationCatalogByGroup,
  listCreationCatalogByFamily,
  resolveCreationTypeFromLoanType
} from "@/products/creation/catalog";

export type {
  ProductCreationTypeIdValue,
  ProductCreationGroupIdValue,
  ProductFormValues,
  ProductSaveResult
} from "@/products/creation/types";

export { ProductCreationTypeId, ProductCreationGroupId } from "@/products/creation/types";
