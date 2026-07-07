const PINNED_LOAN_KEY = "fcc:pinnedLoanId";

export function getPinnedLoanId() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(PINNED_LOAN_KEY);
}

export function setPinnedLoanId(loanId: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (loanId) {
    localStorage.setItem(PINNED_LOAN_KEY, loanId);
    return;
  }

  localStorage.removeItem(PINNED_LOAN_KEY);
}
