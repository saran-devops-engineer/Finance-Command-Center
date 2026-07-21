"use client";

import type { ReactNode } from "react";
import { radius } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { LENDER_SUGGESTIONS, isOtherLender } from "@/products/creation/lenders";
import { formatMoneyInput } from "@/products/creation/money-input";
import type { ProductFormFieldSchema, ProductFormSchema } from "@/products/creation/form-schema";
import type { ProductFormValues } from "@/products/creation/types";

interface ProductFormRendererProps {
  schema: ProductFormSchema;
  form: ProductFormValues;
  errors: string[];
  onChange: (field: string, value: string) => void;
}

export function ProductFormRenderer({ schema, form, errors, onChange }: ProductFormRendererProps) {
  return (
    <div className="space-y-8">
      {errors.length > 0 ? (
        <div
          role="alert"
          aria-live="polite"
          className={cn("space-y-1 bg-white/45 px-4 py-3 text-sm text-destructive", radius.inner)}
        >
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}

      {schema.sections.map((section) => (
        <section key={section.id} className="space-y-4">
          <div className="border-b border-border/60 pb-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {section.title}
            </h2>
          </div>
          <div className="space-y-4">
            {section.fields.map((field) => (
              <ProductFormField
                key={field.id}
                field={field}
                form={form}
                onChange={onChange}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ProductFormField({
  field,
  form,
  onChange
}: {
  field: ProductFormFieldSchema;
  form: ProductFormValues;
  onChange: (field: string, value: string) => void;
}) {
  if (field.type === "lender") {
    return (
      <>
        <SelectField
          label={field.label}
          value={form.lenderPick ?? ""}
          onChange={(value) => onChange("lenderPick", value)}
          options={LENDER_SUGGESTIONS.map((item) => ({ value: item, label: item }))}
          required={field.required}
        />
        {isOtherLender(form.lenderPick ?? "") ? (
          <TextField
            label="Lender name"
            value={form.lenderCustom ?? ""}
            onChange={(value) => onChange("lenderCustom", value)}
            placeholder="Enter lender name"
            required
          />
        ) : null}
      </>
    );
  }

  if (field.id === "lenderCustom") {
    return null;
  }

  switch (field.type) {
    case "money":
      return (
        <MoneyField
          label={field.label}
          value={form[field.id] ?? ""}
          onChange={(value) => onChange(field.id, value)}
          helperText={field.helperText}
          required={field.required}
        />
      );
    case "decimal":
      return (
        <TextField
          label={field.label}
          value={form[field.id] ?? ""}
          onChange={(value) => onChange(field.id, value)}
          inputMode="decimal"
          helperText={field.helperText}
          required={field.required}
        />
      );
    case "date":
      return (
        <TextField
          label={field.label}
          value={form[field.id] ?? ""}
          onChange={(value) => onChange(field.id, value)}
          type="date"
          helperText={field.helperText}
          required={field.required}
        />
      );
    case "textarea":
      return (
        <TextAreaField
          label={field.label}
          value={form[field.id] ?? ""}
          onChange={(value) => onChange(field.id, value)}
          placeholder={field.placeholder}
        />
      );
    case "select":
      return (
        <SelectField
          label={field.label}
          value={form[field.id] ?? ""}
          onChange={(value) => onChange(field.id, value)}
          options={field.options ?? []}
          required={field.required}
        />
      );
    default:
      return (
        <TextField
          label={field.label}
          value={form[field.id] ?? ""}
          onChange={(value) => onChange(field.id, value)}
          placeholder={field.placeholder}
          helperText={field.helperText}
          required={field.required}
        />
      );
  }
}

function FieldShell({
  label,
  helperText,
  required,
  children
}: {
  label: string;
  helperText?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
      {helperText ? (
        <span className="block text-xs leading-5 text-muted-foreground">{helperText}</span>
      ) : null}
    </label>
  );
}

const inputClassName = cn(
  "h-12 w-full border border-border bg-white/45 px-4 text-base outline-none transition placeholder:text-muted-foreground/55 focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
  radius.input
);

function TextField({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  inputMode,
  type = "text",
  required
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  inputMode?: "numeric" | "decimal";
  type?: "text" | "date";
  required?: boolean;
}) {
  return (
    <FieldShell label={label} helperText={helperText} required={required}>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        type={type}
        className={inputClassName}
      />
    </FieldShell>
  );
}

function MoneyField({
  label,
  value,
  onChange,
  helperText,
  required
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
  required?: boolean;
}) {
  return (
    <FieldShell label={label} helperText={helperText} required={required}>
      <input
        value={value}
        onChange={(event) => onChange(formatMoneyInput(event.target.value))}
        inputMode="numeric"
        placeholder="0"
        className={inputClassName}
        aria-describedby={helperText ? `${label}-help` : undefined}
      />
    </FieldShell>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <FieldShell label={label}>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "min-h-24 w-full border border-border bg-white/45 px-4 py-3 text-base outline-none transition placeholder:text-muted-foreground/55 focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
          radius.input
        )}
      />
    </FieldShell>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}) {
  return (
    <FieldShell label={label} required={required}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
