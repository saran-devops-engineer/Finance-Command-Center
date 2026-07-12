import type { Chit, RegisteredChitProviderId } from "@/shared/domain/chit";

export const REGISTERED_CHIT_PROVIDER_OPTIONS: Array<{
  id: RegisteredChitProviderId;
  label: string;
}> = [
  { id: "margadarshi", label: "Margadarshi" },
  { id: "shriram", label: "Shriram" },
  { id: "kapil", label: "Kapil" },
  { id: "other-registered", label: "Other Registered" }
];

export function getRegisteredProviderLabel(id: RegisteredChitProviderId | undefined) {
  if (!id) {
    return "";
  }

  return REGISTERED_CHIT_PROVIDER_OPTIONS.find((option) => option.id === id)?.label ?? "";
}

export function getChitProviderDisplay(chit: Chit) {
  if (chit.providerType === "local") {
    return chit.providerName;
  }

  if (chit.registeredProvider === "other-registered") {
    return chit.providerName || "Other Registered";
  }

  return getRegisteredProviderLabel(chit.registeredProvider) || chit.providerName;
}

export function getPrizeStatusLabel(chit: Chit) {
  return chit.prizeReceived ? "Prize received" : "Prize not received";
}
