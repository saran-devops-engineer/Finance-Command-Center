import { getCreationCatalogEntry } from "@/products/creation/catalog";
import type { ProductFormSchema } from "@/products/creation/form-schema";
import {
  registerProductCreationDefinition,
  type ProductCreationDefinition
} from "@/products/creation/definition";
import { isOtherLender, resolveLenderValue } from "@/products/creation/lenders";
import { ProductCreationTypeId } from "@/products/creation/types";
import type { ProductFormValues } from "@/products/creation/types";
import {
  applyHomeLoanAutoCalculations,
  buildHomeLoanFromForm,
  validateHomeLoanForm,
  type HomeLoanFormState
} from "@/shared/finance/home-loan-form";
import type { Loan } from "@/shared/domain/finance";

const catalog = getCreationCatalogEntry(ProductCreationTypeId.HOME_LOAN)!;

const HOME_LOAN_SCHEMA: ProductFormSchema = {
  sections: [
    {
      id: "basics",
      title: "Loan basics",
      fields: [
        { id: "name", label: "Loan name", type: "text", placeholder: "My Home Loan", required: true },
        { id: "lenderPick", label: "Lender", type: "lender", required: true },
        { id: "lenderCustom", label: "Lender name", type: "text", placeholder: "Enter lender name" }
      ]
    },
    {
      id: "original",
      title: "Original loan",
      fields: [
        { id: "originalAmount", label: "Original amount", type: "money", required: true },
        {
          id: "loanStartDate",
          label: "Start date",
          type: "date",
          required: true,
          helperText: "When the loan was disbursed."
        },
        {
          id: "originalLoanTenureMonths",
          label: "Original tenure",
          type: "text",
          placeholder: "240",
          required: true,
          helperText: "Total tenure in months when the loan started."
        },
        {
          id: "annualInterestRate",
          label: "Interest rate",
          type: "decimal",
          required: true,
          helperText: "Annual rate in percent."
        }
      ]
    },
    {
      id: "current",
      title: "Current snapshot",
      fields: [
        {
          id: "outstandingBalance",
          label: "Current outstanding",
          type: "money",
          required: true
        },
        { id: "monthlyEmi", label: "Current EMI", type: "money", required: true },
        {
          id: "remainingTenureMonths",
          label: "Remaining tenure",
          type: "text",
          required: true,
          helperText: "Months left. Edit if part-payments already reduced tenure."
        }
      ]
    },
    {
      id: "payment",
      title: "Payment",
      fields: [
        {
          id: "emiPaymentDay",
          label: "EMI payment day",
          type: "text",
          placeholder: "1",
          required: true,
          helperText: "Day of the month (1–31)."
        }
      ]
    }
  ]
};

function suggestHomeLoanName(lender: string): string {
  const trimmed = lender.trim();
  if (!trimmed || isOtherLender(trimmed)) {
    return "My Home Loan";
  }

  const shortName = trimmed.replace(/\s+Bank$/i, "").trim();
  return `${shortName} Home Loan`;
}

function toHomeLoanFormState(form: ProductFormValues): HomeLoanFormState {
  const lender = resolveLenderValue(form.lenderPick ?? "", form.lenderCustom ?? "");

  return {
    name: form.name ?? "",
    type: "home",
    lender,
    originalAmount: form.originalAmount ?? "",
    loanStartDate: form.loanStartDate ?? "",
    originalLoanTenureMonths: form.originalLoanTenureMonths ?? "",
    annualInterestRate: form.annualInterestRate ?? "",
    outstandingBalance: form.outstandingBalance ?? "",
    monthlyEmi: form.monthlyEmi ?? "",
    remainingTenureMonths: form.remainingTenureMonths ?? "",
    emiPaymentDay: form.emiPaymentDay ?? "1",
    remainingTenureManuallyOverridden: form.remainingTenureManuallyOverridden === "true"
  };
}

function fromHomeLoanFormState(state: HomeLoanFormState): ProductFormValues {
  const knownLender = state.lender.trim();
  const isKnown = ["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Canara Bank", "Union Bank", "Punjab National Bank", "Bank of Baroda", "Kotak Mahindra Bank", "IDFC First Bank"].includes(
    knownLender
  );

  return {
    name: state.name,
    lenderPick: isKnown ? knownLender : knownLender ? "Other" : "",
    lenderCustom: isKnown ? "" : knownLender,
    lender: knownLender,
    originalAmount: state.originalAmount,
    loanStartDate: state.loanStartDate,
    originalLoanTenureMonths: state.originalLoanTenureMonths,
    annualInterestRate: state.annualInterestRate,
    outstandingBalance: state.outstandingBalance,
    monthlyEmi: state.monthlyEmi,
    remainingTenureMonths: state.remainingTenureMonths,
    emiPaymentDay: state.emiPaymentDay,
    remainingTenureManuallyOverridden: state.remainingTenureManuallyOverridden ? "true" : "false"
  };
}

const homeLoanDefinition: ProductCreationDefinition = {
  catalog,
  entityKind: "loan",
  schema: HOME_LOAN_SCHEMA,
  getInitialFormState: () => ({
    name: "",
    lenderPick: "",
    lenderCustom: "",
    lender: "",
    originalAmount: "",
    loanStartDate: new Date().toISOString().slice(0, 10),
    originalLoanTenureMonths: "240",
    annualInterestRate: "",
    outstandingBalance: "",
    monthlyEmi: "",
    remainingTenureMonths: "",
    emiPaymentDay: "1",
    remainingTenureManuallyOverridden: "false"
  }),
  validate(form) {
    return validateHomeLoanForm(toHomeLoanFormState(form));
  },
  onFieldChange(field, form, previous) {
    const next = { ...form };

    if (field === "lenderPick" || field === "lenderCustom") {
      next.lender = resolveLenderValue(next.lenderPick ?? "", next.lenderCustom ?? "");
      if (!next.name?.trim() || next.name === suggestHomeLoanName(previous.lender ?? "")) {
        next.name = suggestHomeLoanName(next.lender);
      }
    }

    const homeState = toHomeLoanFormState(next);
    const previousState = toHomeLoanFormState(previous);
    const calculated = applyHomeLoanAutoCalculations(homeState, previousState);
    return fromHomeLoanFormState(calculated);
  },
  buildLoan(form, existing) {
    return buildHomeLoanFromForm(toHomeLoanFormState(form), existing);
  },
  loanToFormValues(loan) {
    return fromHomeLoanFormState({
      name: loan.name,
      type: "home",
      lender: loan.lender,
      originalAmount: String(loan.originalAmount),
      loanStartDate: loan.loanStartDate ?? "",
      originalLoanTenureMonths: String(loan.originalLoanTenureMonths ?? ""),
      annualInterestRate: String(loan.annualInterestRate),
      outstandingBalance: String(loan.outstandingBalance),
      monthlyEmi: String(loan.monthlyEmi),
      remainingTenureMonths: String(loan.remainingTenureMonths),
      emiPaymentDay: String(loan.emiPaymentDay ?? 1),
      remainingTenureManuallyOverridden: loan.remainingTenureManuallyOverridden ?? false
    });
  }
};

registerProductCreationDefinition(homeLoanDefinition);

export { homeLoanDefinition };
