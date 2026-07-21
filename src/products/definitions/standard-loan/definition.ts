import { getCreationCatalogEntry } from "@/products/creation/catalog";
import type { ProductFormSchema } from "@/products/creation/form-schema";
import {
  registerProductCreationDefinition,
  type ProductCreationDefinition
} from "@/products/creation/definition";
import { isOtherLender, resolveLenderValue } from "@/products/creation/lenders";
import {
  ProductCreationTypeId,
  type ProductCreationCatalogEntry,
  type ProductCreationTypeIdValue,
  type ProductFormValues
} from "@/products/creation/types";
import { buildLoanFromForm, validateLoanForm, type LoanFormState } from "@/shared/finance/loan-form";
import type { Loan, LoanType } from "@/shared/domain/finance";

const STANDARD_LOAN_SCHEMA: ProductFormSchema = {
  sections: [
    {
      id: "basics",
      title: "Loan basics",
      fields: [
        { id: "name", label: "Loan name", type: "text", placeholder: "My Loan", required: true },
        { id: "lenderPick", label: "Lender", type: "lender", required: true },
        { id: "lenderCustom", label: "Lender name", type: "text", placeholder: "Enter lender name" }
      ]
    },
    {
      id: "amounts",
      title: "Loan details",
      fields: [
        { id: "originalAmount", label: "Original amount", type: "money" },
        { id: "outstandingBalance", label: "Current outstanding", type: "money", required: true },
        {
          id: "annualInterestRate",
          label: "Interest rate",
          type: "decimal",
          required: true,
          helperText: "Annual rate in percent."
        },
        { id: "monthlyEmi", label: "Current EMI", type: "money", required: true },
        {
          id: "remainingTenureMonths",
          label: "Remaining tenure",
          type: "text",
          helperText: "Months left on the loan."
        },
        { id: "nextDueDate", label: "Next due date", type: "date", required: true }
      ]
    },
    {
      id: "notes",
      title: "Notes",
      fields: [
        {
          id: "notes",
          label: "Notes",
          type: "textarea",
          placeholder: "Optional context for future you"
        }
      ]
    }
  ]
};

function suggestStandardLoanName(label: string, lender: string): string {
  const trimmed = lender.trim();
  if (!trimmed || isOtherLender(trimmed)) {
    return `My ${label}`;
  }

  const shortName = trimmed.replace(/\s+Bank$/i, "").trim();
  return `${shortName} ${label}`;
}

function toLoanFormState(
  form: ProductFormValues,
  catalog: ProductCreationCatalogEntry
): LoanFormState {
  return {
    name: form.name ?? "",
    type: catalog.loanType ?? "other",
    customTypeName: catalog.customTypeName ?? "",
    lender: resolveLenderValue(form.lenderPick ?? "", form.lenderCustom ?? ""),
    originalAmount: form.originalAmount ?? "",
    outstandingBalance: form.outstandingBalance ?? "",
    annualInterestRate: form.annualInterestRate ?? "",
    monthlyEmi: form.monthlyEmi ?? "",
    remainingTenureMonths: form.remainingTenureMonths ?? "",
    nextDueDate: form.nextDueDate ?? new Date().toISOString().slice(0, 10),
    notes: form.notes ?? ""
  };
}

function fromLoanFormState(state: LoanFormState): ProductFormValues {
  const knownLenders = [
    "HDFC Bank",
    "ICICI Bank",
    "SBI",
    "Axis Bank",
    "Canara Bank",
    "Union Bank",
    "Punjab National Bank",
    "Bank of Baroda",
    "Kotak Mahindra Bank",
    "IDFC First Bank"
  ];
  const isKnown = knownLenders.includes(state.lender);

  return {
    name: state.name,
    lenderPick: isKnown ? state.lender : state.lender ? "Other" : "",
    lenderCustom: isKnown ? "" : state.lender,
    lender: state.lender,
    originalAmount: state.originalAmount,
    outstandingBalance: state.outstandingBalance,
    annualInterestRate: state.annualInterestRate,
    monthlyEmi: state.monthlyEmi,
    remainingTenureMonths: state.remainingTenureMonths,
    nextDueDate: state.nextDueDate,
    notes: state.notes
  };
}

function createStandardLoanDefinition(
  creationTypeId: ProductCreationTypeIdValue,
  label: string,
  loanType: LoanType,
  customTypeName?: string
): ProductCreationDefinition {
  const catalog = getCreationCatalogEntry(creationTypeId)!;

  return {
    catalog,
    entityKind: "loan",
    schema: STANDARD_LOAN_SCHEMA,
    getInitialFormState: () => ({
      name: "",
      lenderPick: "",
      lenderCustom: "",
      lender: "",
      originalAmount: "",
      outstandingBalance: "",
      annualInterestRate: "",
      monthlyEmi: "",
      remainingTenureMonths: "",
      nextDueDate: new Date().toISOString().slice(0, 10),
      notes: ""
    }),
    validate(form) {
      const errors = validateLoanForm(toLoanFormState(form, catalog));
      if (!resolveLenderValue(form.lenderPick ?? "", form.lenderCustom ?? "").trim()) {
        errors.unshift("Lender name is required.");
      }
      return errors;
    },
    onFieldChange(field, form, previous) {
      const next = { ...form };
      if (field === "lenderPick" || field === "lenderCustom") {
        next.lender = resolveLenderValue(next.lenderPick ?? "", next.lenderCustom ?? "");
        if (!next.name?.trim() || next.name === suggestStandardLoanName(label, previous.lender ?? "")) {
          next.name = suggestStandardLoanName(label, next.lender);
        }
      }
      return next;
    },
    buildLoan(form, existing) {
      return buildLoanFromForm(toLoanFormState(form, catalog), existing);
    },
    loanToFormValues(loan) {
      return fromLoanFormState({
        name: loan.name,
        type: loan.type,
        customTypeName: loan.customTypeName ?? "",
        lender: loan.lender,
        originalAmount: String(loan.originalAmount),
        outstandingBalance: String(loan.outstandingBalance),
        annualInterestRate: String(loan.annualInterestRate),
        monthlyEmi: String(loan.monthlyEmi),
        remainingTenureMonths: String(loan.remainingTenureMonths),
        nextDueDate: loan.nextDueDate,
        notes: loan.notes ?? ""
      });
    }
  };
}

[
  createStandardLoanDefinition(
    ProductCreationTypeId.PERSONAL_LOAN,
    "Personal Loan",
    "personal"
  ),
  createStandardLoanDefinition(
    ProductCreationTypeId.VEHICLE_LOAN,
    "Vehicle Loan",
    "vehicle"
  ),
  createStandardLoanDefinition(
    ProductCreationTypeId.EDUCATION_LOAN,
    "Education Loan",
    "education"
  ),
  createStandardLoanDefinition(ProductCreationTypeId.LAP, "Loan Against Property", "custom", "Loan Against Property"),
  createStandardLoanDefinition(ProductCreationTypeId.BUSINESS_LOAN, "Business Loan", "custom", "Business Loan"),
  createStandardLoanDefinition(ProductCreationTypeId.OTHER_LOAN, "Loan", "other")
].forEach(registerProductCreationDefinition);
