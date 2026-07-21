import { getCreationCatalogEntry } from "@/products/creation/catalog";
import {
  registerProductCreationDefinition,
  type ProductCreationDefinition
} from "@/products/creation/definition";
import { ProductCreationTypeId } from "@/products/creation/types";

const goldLoanDefinition: ProductCreationDefinition = {
  catalog: getCreationCatalogEntry(ProductCreationTypeId.GOLD_LOAN)!,
  entityKind: "loan",
  usesDedicatedForm: "gold-loan",
  getInitialFormState: () => ({}),
  validate: () => []
};

const chitDefinition: ProductCreationDefinition = {
  catalog: getCreationCatalogEntry(ProductCreationTypeId.CHIT)!,
  entityKind: "chit",
  usesDedicatedForm: "chit",
  getInitialFormState: () => ({}),
  validate: () => []
};

registerProductCreationDefinition(goldLoanDefinition);
registerProductCreationDefinition(chitDefinition);
