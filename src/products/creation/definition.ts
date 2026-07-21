import type { ProductFormSchema } from "@/products/creation/form-schema";
import type {
  ProductCreationCatalogEntry,
  ProductCreationTypeIdValue,
  ProductFormValues
} from "@/products/creation/types";
import type { Chit } from "@/shared/domain/chit";
import type { Loan } from "@/shared/domain/finance";

export type ProductEntityKind = "loan" | "chit";

export interface ProductCreationDefinition {
  catalog: ProductCreationCatalogEntry;
  entityKind: ProductEntityKind;
  schema?: ProductFormSchema;
  /** Use dedicated component for complex forms (gold, chit). */
  usesDedicatedForm?: "gold-loan" | "chit";
  getInitialFormState: () => ProductFormValues;
  validate: (form: ProductFormValues) => string[];
  onFieldChange?: (
    field: string,
    form: ProductFormValues,
    previous: ProductFormValues
  ) => ProductFormValues;
  buildLoan?: (form: ProductFormValues, existing?: Loan) => Loan;
  loanToFormValues?: (loan: Loan) => ProductFormValues;
}

const definitions = new Map<ProductCreationTypeIdValue, ProductCreationDefinition>();

export function registerProductCreationDefinition(definition: ProductCreationDefinition) {
  definitions.set(definition.catalog.creationTypeId, definition);
}

export function getProductCreationDefinition(
  creationTypeId: ProductCreationTypeIdValue
): ProductCreationDefinition | undefined {
  return definitions.get(creationTypeId);
}

export function listProductCreationDefinitions() {
  return [...definitions.values()];
}

export function requireProductCreationDefinition(
  creationTypeId: ProductCreationTypeIdValue
): ProductCreationDefinition {
  const definition = getProductCreationDefinition(creationTypeId);

  if (!definition) {
    throw new Error(`Unknown product creation type: ${creationTypeId}`);
  }

  return definition;
}

/** Map a persisted chit to its creation type (always chit). */
export function resolveChitCreationTypeId(): ProductCreationTypeIdValue {
  return "chit";
}
