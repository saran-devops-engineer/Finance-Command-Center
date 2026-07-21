export type ProductFormFieldType =
  | "text"
  | "money"
  | "decimal"
  | "date"
  | "lender"
  | "textarea"
  | "select";

export interface ProductFormFieldOption {
  value: string;
  label: string;
}

export interface ProductFormFieldSchema {
  id: string;
  label: string;
  type: ProductFormFieldType;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  options?: ProductFormFieldOption[];
}

export interface ProductFormSectionSchema {
  id: string;
  title: string;
  fields: ProductFormFieldSchema[];
}

export interface ProductFormSchema {
  sections: ProductFormSectionSchema[];
}
