import { financeRepository } from "@/repositories";

export async function getPinnedLoanId() {
  const settings = await financeRepository.getSettings();
  return settings.pinnedLoanId;
}

export async function setPinnedLoanId(loanId: string | null) {
  await financeRepository.saveSettings({ pinnedLoanId: loanId });
}
