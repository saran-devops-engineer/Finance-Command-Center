import type {
  Chit,
  ChitCustomRules,
  ChitProviderType,
  ChitYesNoUnknown,
  RegisteredChitProviderId
} from "@/shared/domain/chit";
import { applyChitDerivedFields } from "@/shared/finance/chit-calculations";
import { getRegisteredProviderLabel } from "@/lib/chit-display";

export interface ChitFormState {
  providerType: ChitProviderType;
  registeredProvider: RegisteredChitProviderId;
  providerName: string;
  chitName: string;
  chitValue: string;
  monthlyContribution: string;
  totalDurationMonths: string;
  startDate: string;
  currentRunningMonth: string;
  prizeReceived: "yes" | "no";
  auctionMonth: string;
  prizeAmountReceived: string;
  winningDiscount: string;
  prizeNotes: string;
  winnerSelection: ChitCustomRules["winnerSelection"];
  discountDistribution: ChitCustomRules["discountDistribution"];
  paymentChangesAfterAuction: ChitYesNoUnknown;
  organizerCommission: ChitYesNoUnknown;
  commissionInputType: "percentage" | "fixed";
  commissionPercentage: string;
  commissionFixedAmount: string;
  notes: string;
}

export const initialChitFormState: ChitFormState = {
  providerType: "registered",
  registeredProvider: "margadarshi",
  providerName: "Margadarshi",
  chitName: "",
  chitValue: "",
  monthlyContribution: "",
  totalDurationMonths: "",
  startDate: new Date().toISOString().slice(0, 10),
  currentRunningMonth: "1",
  prizeReceived: "no",
  auctionMonth: "",
  prizeAmountReceived: "",
  winningDiscount: "",
  prizeNotes: "",
  winnerSelection: "unknown",
  discountDistribution: "unknown",
  paymentChangesAfterAuction: "unknown",
  organizerCommission: "unknown",
  commissionInputType: "percentage",
  commissionPercentage: "",
  commissionFixedAmount: "",
  notes: ""
};

export function toNumber(value: string) {
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function chitToFormState(chit: Chit): ChitFormState {
  return {
    providerType: chit.providerType,
    registeredProvider: chit.registeredProvider ?? "margadarshi",
    providerName: chit.providerName,
    chitName: chit.chitName,
    chitValue: String(chit.chitValue),
    monthlyContribution: String(chit.monthlyContribution),
    totalDurationMonths: String(chit.totalDurationMonths),
    startDate: chit.startDate,
    currentRunningMonth: String(chit.currentRunningMonth),
    prizeReceived: chit.prizeReceived ? "yes" : "no",
    auctionMonth: chit.auctionMonth ? String(chit.auctionMonth) : "",
    prizeAmountReceived: chit.prizeAmountReceived ? String(chit.prizeAmountReceived) : "",
    winningDiscount: chit.winningDiscount ? String(chit.winningDiscount) : "",
    prizeNotes: chit.prizeNotes ?? "",
    winnerSelection: chit.customRules?.winnerSelection ?? "unknown",
    discountDistribution: chit.customRules?.discountDistribution ?? "unknown",
    paymentChangesAfterAuction: chit.customRules?.paymentChangesAfterAuction ?? "unknown",
    organizerCommission: chit.customRules?.organizerCommission ?? "unknown",
    commissionInputType:
      chit.customRules?.commissionMode === "fixed" ? "fixed" : "percentage",
    commissionPercentage:
      chit.customRules?.commissionPercentage !== undefined
        ? String(chit.customRules.commissionPercentage)
        : "",
    commissionFixedAmount:
      chit.customRules?.commissionFixedAmount !== undefined
        ? String(chit.customRules.commissionFixedAmount)
        : "",
    notes: chit.notes ?? ""
  };
}

export function validateChitForm(form: ChitFormState) {
  const errors: string[] = [];
  const chitValue = toNumber(form.chitValue);
  const monthlyContribution = toNumber(form.monthlyContribution);
  const totalDurationMonths = toNumber(form.totalDurationMonths);
  const currentRunningMonth = toNumber(form.currentRunningMonth);
  const prizeAmountReceived = toNumber(form.prizeAmountReceived);
  const auctionMonth = toNumber(form.auctionMonth);

  if (!form.chitName.trim()) {
    errors.push("Chit name is required.");
  }

  if (!form.providerName.trim()) {
    errors.push("Provider name is required.");
  }

  if (chitValue <= 0) {
    errors.push("Chit value must be greater than zero.");
  }

  if (monthlyContribution <= 0) {
    errors.push("Monthly contribution must be greater than zero.");
  }

  if (totalDurationMonths <= 0) {
    errors.push("Total duration must be greater than zero.");
  }

  if (currentRunningMonth <= 0) {
    errors.push("Current running month must be at least 1.");
  }

  if (currentRunningMonth > totalDurationMonths) {
    errors.push("Current running month cannot exceed total duration.");
  }

  if (!form.startDate) {
    errors.push("Start date is required.");
  }

  if (form.prizeReceived === "yes") {
    if (!form.auctionMonth.trim() || auctionMonth <= 0) {
      errors.push("Auction month is required when prize is received.");
    }

    if (auctionMonth > currentRunningMonth) {
      errors.push("Auction month cannot be after the current running month.");
    }

    if (form.prizeAmountReceived.trim() && prizeAmountReceived > chitValue) {
      errors.push("Prize amount cannot exceed chit value.");
    }
  }

  if (form.providerType === "local" && form.organizerCommission === "yes") {
    if (form.commissionInputType === "percentage" && toNumber(form.commissionPercentage) <= 0) {
      errors.push("Enter the commission percentage.");
    }

    if (form.commissionInputType === "fixed" && toNumber(form.commissionFixedAmount) <= 0) {
      errors.push("Enter the commission amount.");
    }
  }

  return errors;
}

function buildCustomRules(form: ChitFormState): ChitCustomRules | undefined {
  if (form.providerType !== "local") {
    return undefined;
  }

  const rules: ChitCustomRules = {
    winnerSelection: form.winnerSelection,
    discountDistribution: form.discountDistribution,
    paymentChangesAfterAuction: form.paymentChangesAfterAuction,
    organizerCommission: form.organizerCommission
  };

  if (form.organizerCommission === "yes") {
    if (form.commissionInputType === "percentage") {
      rules.commissionMode = "percentage";
      rules.commissionPercentage = toNumber(form.commissionPercentage);
    } else {
      rules.commissionMode = "fixed";
      rules.commissionFixedAmount = toNumber(form.commissionFixedAmount);
    }
  } else {
    rules.commissionMode = "none";
  }

  return rules;
}

function resolveProviderName(form: ChitFormState) {
  if (form.providerType === "local") {
    return form.providerName.trim();
  }

  if (form.registeredProvider === "other-registered") {
    return form.providerName.trim();
  }

  return getRegisteredProviderLabel(form.registeredProvider) || form.providerName.trim();
}

export function buildChitFromForm(form: ChitFormState, existing?: Chit): Chit {
  const now = new Date().toISOString();
  const prizeReceived = form.prizeReceived === "yes";

  const chit: Chit = {
    id: existing?.id ?? `chit-${crypto.randomUUID()}`,
    providerType: form.providerType,
    registeredProvider:
      form.providerType === "registered" ? form.registeredProvider : undefined,
    providerName: resolveProviderName(form),
    chitName: form.chitName.trim(),
    chitValue: toNumber(form.chitValue),
    monthlyContribution: toNumber(form.monthlyContribution),
    totalDurationMonths: toNumber(form.totalDurationMonths),
    startDate: form.startDate,
    currentRunningMonth: toNumber(form.currentRunningMonth),
    prizeReceived,
    auctionMonth: prizeReceived ? toNumber(form.auctionMonth) : undefined,
    prizeAmountReceived:
      prizeReceived && form.prizeAmountReceived.trim()
        ? toNumber(form.prizeAmountReceived)
        : undefined,
    winningDiscount:
      prizeReceived && form.winningDiscount.trim()
        ? toNumber(form.winningDiscount)
        : undefined,
    prizeNotes: prizeReceived ? form.prizeNotes.trim() || undefined : undefined,
    customRules: buildCustomRules(form),
    nextDueDate: existing?.nextDueDate ?? form.startDate,
    status: existing?.status ?? "active",
    archivedAt: existing?.archivedAt,
    archiveReason: existing?.archiveReason,
    deletedAt: existing?.deletedAt,
    notes: form.notes.trim() || undefined,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };

  return applyChitDerivedFields(chit);
}

export function registeredProviderToName(provider: RegisteredChitProviderId) {
  return getRegisteredProviderLabel(provider);
}
