"use client";

import { radius } from "@/lib/design-tokens";
import { clarityMaskProps } from "@/lib/privacy/clarity-mask";
import { cn } from "@/lib/utils";
import { loanTypeOptions } from "@/shared/finance/loan-form";
import type { LoanType } from "@/shared/domain/finance";

interface LoanFormFieldsProps {
  form: LoanFormState;
  errors: string[];
  onChange: <Key extends keyof LoanFormState>(field: Key, value: LoanFormState[Key]) => void;
}

export function LoanFormFields({ form, errors, onChange }: LoanFormFieldsProps) {
  return (
    <div className="space-y-5">
      {errors.length > 0 ? (
        <div
          role="alert"
          className={cn("space-y-1 bg-white/45 px-4 py-3 text-sm text-destructive", radius.inner)}
        >
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}

      <Field
        label="Loan name"
        value={form.name}
        onChange={(value) => onChange("name", value)}
        placeholder="Plot Loan"
      />

      <label className="block space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Loan type
        </span>
        <select
          value={form.type}
          onChange={(event) => onChange("type", event.target.value as LoanType)}
          className={cn(
            "h-12 w-full border border-border bg-white/45 px-4 text-base outline-none focus:border-primary",
            radius.input
          )}
        >
          {loanTypeOptions.map((loanType) => (
            <option key={loanType.value} value={loanType.value}>
              {loanType.label}
            </option>
          ))}
        </select>
      </label>

      {form.type === "custom" ? (
        <Field
          label="Custom type"
          value={form.customTypeName}
          onChange={(value) => onChange("customTypeName", value)}
          placeholder="Office advance"
        />
      ) : null}

      <Field
        label="Bank / lender"
        value={form.lender}
        onChange={(value) => onChange("lender", value)}
        placeholder="Tata Capital"
      />
      <Field
        label="Original principal"
        value={form.originalAmount}
        onChange={(value) => onChange("originalAmount", value)}
        inputMode="numeric"
      />
      <Field
        label="Current outstanding balance"
        value={form.outstandingBalance}
        onChange={(value) => onChange("outstandingBalance", value)}
        inputMode="numeric"
      />
      <Field
        label="Interest rate"
        value={form.annualInterestRate}
        onChange={(value) => onChange("annualInterestRate", value)}
        inputMode="decimal"
        helperText="Annual rate in percent."
      />
      <Field
        label="Current EMI"
        value={form.monthlyEmi}
        onChange={(value) => onChange("monthlyEmi", value)}
        inputMode="numeric"
      />
      <Field
        label="Remaining tenure"
        value={form.remainingTenureMonths}
        onChange={(value) => onChange("remainingTenureMonths", value)}
        inputMode="numeric"
        helperText="Months left on the loan."
      />
      <Field
        label="Next due date"
        value={form.nextDueDate}
        onChange={(value) => onChange("nextDueDate", value)}
        type="date"
      />
      <label className="block space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Notes
        </span>
        <textarea
          {...clarityMaskProps}
          value={form.notes}
          onChange={(event) => onChange("notes", event.target.value)}
          placeholder="Optional context for future you"
          className={cn(
            "min-h-24 w-full border border-border bg-white/45 px-4 py-3 text-base outline-none transition placeholder:text-muted-foreground/55 focus:border-primary",
            radius.input
          )}
        />
      </label>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: "numeric" | "decimal";
  type?: "text" | "date";
  helperText?: string;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  type = "text",
  helperText
}: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        type={type}
        className={cn(
          "h-12 w-full border border-border bg-white/45 px-4 text-base outline-none transition placeholder:text-muted-foreground/55 focus:border-primary",
          radius.input
        )}
      />
      {helperText ? (
        <span className="block text-xs leading-5 text-muted-foreground">{helperText}</span>
      ) : null}
    </label>
  );
}
